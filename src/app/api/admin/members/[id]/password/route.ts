export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { hashPassword, requireSuperAdmin } from "@/lib/core/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin();

    const { id } = params;

    const account = await prisma.account.findUnique({
      where: { id },
      select: { id: true, type: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!(account.type === "MEMBER")) {
      return NextResponse.json(
        { error: "Only member accounts can have passwords reset" },
        { status: 400 }
      );
    }

    // Generate secure random password (9 bytes = ~12 base64 characters)
    const plainPassword = randomBytes(9).toString("base64");
    const passwordHash = await hashPassword(plainPassword);

    await prisma.account.update({
      where: { id },
      data: { passwordHash },
    });

    return NextResponse.json(
      {
        message: "Password reset successfully",
        newPassword: plainPassword,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error resetting password:", error);
    if (
      error.message === "Unauthorized" ||
      error.message.includes("Forbidden")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
