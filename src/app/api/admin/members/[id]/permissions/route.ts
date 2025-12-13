export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { requireAdmin } from "@/lib/core/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAdmin();

    const { id } = params;
    const { readAccess, writeAccess, canLogin } = await request.json();

    const account = await prisma.account.findUnique({
      where: { id },
      select: { id: true, isMember: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!account.isMember) {
      return NextResponse.json(
        { error: "Only member accounts can have permissions updated" },
        { status: 400 }
      );
    }

    const updateData: any = {
      accessUpdatedAt: new Date(),
      accessUpdatedBy: currentUser.id === "admin" ? null : currentUser.id,
    };

    if (typeof readAccess === "boolean") {
      updateData.readAccess = readAccess;
    }

    if (typeof writeAccess === "boolean") {
      updateData.writeAccess = writeAccess;
    }

    if (typeof canLogin === "boolean") {
      updateData.canLogin = canLogin;
    }

    const updated = await prisma.account.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        readAccess: true,
        writeAccess: true,
        canLogin: true,
      },
    });

    return NextResponse.json(
      {
        message: "Access updated successfully",
        account: {
          id: updated.id,
          readAccess: updated.readAccess,
          writeAccess: updated.writeAccess,
          canLogin: updated.canLogin,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating access:", error);
    if (
      error.message === "UNAUTHORIZED" ||
      error.message === "FORBIDDEN_ADMIN"
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update access" },
      { status: 500 }
    );
  }
}
