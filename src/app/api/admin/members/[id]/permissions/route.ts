export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { id } = params;
    const { readAccess, writeAccess } = await request.json();

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

    const updateData: any = {};

    if (typeof readAccess === "boolean") {
      updateData.readAccess = readAccess;
    }

    if (typeof writeAccess === "boolean") {
      updateData.writeAccess = writeAccess;
    }

    const updated = await prisma.account.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        message: "Permissions updated successfully",
        account: {
          id: updated.id,
          readAccess: updated.readAccess,
          writeAccess: updated.writeAccess,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating permissions:", error);
    if (
      error.message === "UNAUTHORIZED" ||
      error.message === "FORBIDDEN_ADMIN"
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}
