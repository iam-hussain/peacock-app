export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/core/auth";
import { invalidateDashboardCaches } from "@/lib/core/cache-invalidation";
import { RATE_LIMITS, rateLimitResponse } from "@/lib/core/rate-limit";
import {
  recalculatePassbooks,
  recalculateSingleMemberPassbook,
} from "@/logic/reset-handler";

export async function POST(request: Request) {
  // Rate limit heavy operations
  const rateLimited = rateLimitResponse(
    request,
    "recalculate",
    RATE_LIMITS.heavy
  );
  if (rateLimited) return rateLimited;

  try {
    // Admin and super admin can recalculate passbooks
    await requireAdmin();

    // Parse optional memberId from request body
    let memberId: string | undefined;
    try {
      const body = await request.json();
      memberId = body?.memberId;
    } catch {
      // Body may be empty for full recalculation — that's fine
    }

    if (memberId) {
      // Recalculate a single member's passbook + adjust club passbook
      await recalculateSingleMemberPassbook(memberId);
    } else {
      // Recalculate all passbooks
      await recalculatePassbooks();
    }

    // Clear all caches after recalculation
    await invalidateDashboardCaches();

    return NextResponse.json({
      success: true,
      ...(memberId ? { memberId, mode: "single-member" } : { mode: "full" }),
    });
  } catch (error: any) {
    console.error(error);
    // Handle authorization errors
    if (
      error?.message === "FORBIDDEN_ADMIN" ||
      error?.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Recalculation failed",
      },
      { status: 500 }
    );
  }
}
