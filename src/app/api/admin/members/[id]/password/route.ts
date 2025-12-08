export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { hashPassword, requireSuperAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin();

    const { id } = params;
    const { newPassword } = await request.json();

    if (!newPassword) {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id },
      select: { id: true, isMember: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!account.isMember) {
      return NextResponse.json(
        { error: "Only member accounts can have passwords reset" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.account.update({
      where: { id },
      data: { passwordHash },
    });

    return NextResponse.json(
      { message: "Password reset successfully" },
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
