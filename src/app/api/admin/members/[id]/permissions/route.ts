export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { requireAdmin } from "@/lib/core/auth";
import { invalidateAccountCaches } from "@/lib/core/cache-invalidation";

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
      select: { id: true, type: true, accessLevel: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!(account.type === "MEMBER")) {
      return NextResponse.json(
        { error: "Only member accounts can have permissions updated" },
        { status: 400 }
      );
    }

    const hasReadAccess =
      account.accessLevel === "READ" ||
      account.accessLevel === "WRITE" ||
      account.accessLevel === "ADMIN";
    const hasWriteAccess =
      account.accessLevel === "WRITE" || account.accessLevel === "ADMIN";

    let finalRead =
      typeof readAccess === "boolean" ? readAccess : hasReadAccess;
    let finalWrite =
      typeof writeAccess === "boolean" ? writeAccess : hasWriteAccess;

    let finalAccessLevel: "READ" | "WRITE" | "ADMIN" = "READ";
    if (finalWrite) {
      finalAccessLevel = "WRITE";
    } else if (finalRead) {
      finalAccessLevel = "READ";
    } else {
      finalAccessLevel = "READ";
      finalRead = false;
      finalWrite = false;
    }

    const finalCanLogin =
      typeof canLogin === "boolean" ? canLogin : finalWrite || finalRead;

    const updateData: any = {
      accessLevel: finalAccessLevel,
      canLogin: finalCanLogin,
      accessUpdatedAt: new Date(),
      accessUpdatedBy: currentUser.id === "admin" ? null : currentUser.id,
    };

    const updated = await prisma.account.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        accessLevel: true,
        canLogin: true,
      },
    });

    // Clear all caches after permissions update
    await invalidateAccountCaches();

    return NextResponse.json(
      {
        message: "Access updated successfully",
        account: {
          id: updated.id,
          accessLevel: updated.accessLevel,
          readAccess:
            updated.accessLevel === "READ" ||
            updated.accessLevel === "WRITE" ||
            updated.accessLevel === "ADMIN",
          writeAccess:
            updated.accessLevel === "WRITE" || updated.accessLevel === "ADMIN",
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
