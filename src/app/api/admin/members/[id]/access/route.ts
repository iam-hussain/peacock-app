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
    const body = await request.json();
    const { readAccess, writeAccess, role } = body;

    const account = await prisma.account.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        accessLevel: true,
        role: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!(account.type === "MEMBER")) {
      return NextResponse.json(
        { error: "Only member accounts can have access updated" },
        { status: 400 }
      );
    }

    // Apply rules server-side to ensure consistency
    // Determine what was explicitly provided vs what to keep from current state
    const readAccessProvided = typeof readAccess === "boolean";
    const writeAccessProvided = typeof writeAccess === "boolean";
    const roleProvided = role !== undefined && role !== null;

    const hasReadAccess =
      account.accessLevel === "READ" ||
      account.accessLevel === "WRITE" ||
      account.accessLevel === "ADMIN";
    const hasWriteAccess =
      account.accessLevel === "WRITE" || account.accessLevel === "ADMIN";

    let finalReadAccess = readAccessProvided ? readAccess : hasReadAccess;
    let finalWriteAccess = writeAccessProvided ? writeAccess : hasWriteAccess;
    let finalRole = roleProvided ? role : account.role;

    // Ensure role is valid enum value
    if (
      finalRole !== "ADMIN" &&
      finalRole !== "MEMBER" &&
      finalRole !== "SUPER_ADMIN"
    ) {
      finalRole = "MEMBER";
    }

    // Apply rules in priority order:
    // 1. If Admin role is explicitly set → Read ON, Write ON (highest priority)
    if (
      roleProvided &&
      (role === "ADMIN" || role?.toString().toUpperCase() === "ADMIN")
    ) {
      finalRole = "ADMIN";
      finalReadAccess = true;
      finalWriteAccess = true;
    }
    // 2. If Admin role is explicitly removed → keep Read/Write as is
    else if (roleProvided && role === "MEMBER") {
      finalRole = "MEMBER";
      // Keep Read/Write as they are (don't auto-change when removing Admin)
    }
    // 3. If Write is explicitly set ON → Read ON, Admin OFF
    else if (writeAccessProvided && writeAccess) {
      finalReadAccess = true;
      finalWriteAccess = true;
      // If role wasn't explicitly set and it's currently ADMIN, keep it
      // Otherwise set to MEMBER
      if (!roleProvided && account.role !== "ADMIN") {
        finalRole = "MEMBER";
      } else if (roleProvided && role === "MEMBER") {
        finalRole = "MEMBER";
      }
    }
    // 4. If Write is explicitly set OFF → keep Read as is, Admin OFF
    else if (writeAccessProvided && !writeAccess) {
      finalWriteAccess = false;
      // If Write is OFF, Admin must also be OFF
      if (finalRole === "ADMIN") {
        finalRole = "MEMBER";
      }
    }
    // 5. If Read is explicitly set ON → Write OFF, Admin OFF (Read-only mode)
    // But only if Write wasn't explicitly set
    else if (readAccessProvided && readAccess && !writeAccessProvided) {
      // If turning Read ON and Write wasn't set, turn Write and Admin OFF
      finalWriteAccess = false;
      if (finalRole === "ADMIN") {
        finalRole = "MEMBER";
      }
    }
    // 6. If Read is explicitly set OFF → Write OFF, Admin OFF (no access)
    else if (readAccessProvided && !readAccess) {
      finalReadAccess = false;
      finalWriteAccess = false;
      finalRole = "MEMBER";
    }
    // 7. If Admin role is currently set → ensure Read and Write are ON
    else if (finalRole === "ADMIN") {
      finalReadAccess = true;
      finalWriteAccess = true;
    }
    // 8. If Write is ON → ensure Read is ON
    else if (finalWriteAccess && !finalReadAccess) {
      finalReadAccess = true;
    }

    // Compute target access level from booleans/role
    let finalAccessLevel: "READ" | "WRITE" | "ADMIN" = "READ";
    if (finalRole === "ADMIN") {
      finalAccessLevel = "ADMIN";
    } else if (finalWriteAccess) {
      finalAccessLevel = "WRITE";
    } else if (finalReadAccess) {
      finalAccessLevel = "READ";
    } else {
      // No explicit read/write -> keep minimal READ to satisfy enum
      finalAccessLevel = "READ";
      finalReadAccess = false;
      finalWriteAccess = false;
    }

    // canLogin mirrors any access granted or admin role
    const canLogin =
      finalAccessLevel === "ADMIN" ||
      finalAccessLevel === "WRITE" ||
      finalAccessLevel === "READ";

    const updateData: any = {
      accessLevel: finalAccessLevel,
      role: finalRole as "ADMIN" | "MEMBER" | "SUPER_ADMIN",
      canLogin,
      accessUpdatedAt: new Date(),
      accessUpdatedById: currentUser.id === "admin" ? null : currentUser.id,
    };

    console.log("Updating account with:", updateData);

    const updated = await prisma.account.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        accessLevel: true,
        role: true,
        canLogin: true,
      },
    });

    // Clear all caches after access update
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
          role: updated.role,
          canLogin: updated.canLogin,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating access:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    if (
      error.message === "UNAUTHORIZED" ||
      error.message === "FORBIDDEN_ADMIN"
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    // Return more detailed error message
    const errorMessage = error.message || "Failed to update access";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
