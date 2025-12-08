export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { hashPassword, requireAuth, verifyPassword } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();

    // Explicitly reject super-admin password changes
    if (user.kind === "admin") {
      return NextResponse.json(
        { error: "Super Admin password cannot be changed from the dashboard" },
        { status: 403 }
      );
    }

    if (user.kind !== "member") {
      return NextResponse.json(
        { error: "Only members can change password" },
        { status: 403 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: user.accountId },
      select: { passwordHash: true },
    });

    if (!account || !account.passwordHash) {
      return NextResponse.json(
        { error: "Account not found or password not set" },
        { status: 404 }
      );
    }

    const isValidPassword = await verifyPassword(
      currentPassword,
      account.passwordHash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.account.update({
      where: { id: user.accountId },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error changing password:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
