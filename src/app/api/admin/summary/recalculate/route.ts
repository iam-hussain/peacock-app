export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/core/auth";
import { invalidateDashboardCaches } from "@/lib/core/cache-invalidation";
import { handleAuthError } from "@/lib/core/error-handler";
import { recalculateSummary } from "@/logic/reset-handler";

/**
 * POST /api/admin/summary/recalculate
 * Recalculate all monthly summary snapshots (analytics)
 * Admin-only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    // Optional: Check for force flag in body
    const body = await request.json().catch(() => ({}));
    const _force = body.force === true;

    // Recalculate summary snapshots only
    // This is a long-running operation, so we'll let it complete
    await recalculateSummary();

    // Clear all caches after summary recalculation
    await invalidateDashboardCaches();

    return NextResponse.json({
      success: true,
      message: "Analytics data recalculated successfully",
    });
  } catch (error: any) {
    if (
      error.message === "FORBIDDEN_ADMIN" ||
      error.message === "UNAUTHORIZED"
    ) {
      return handleAuthError(error);
    }

    console.error("Error recalculating summary:", error);

    // Return proper error response
    const errorMessage =
      error?.message || "Failed to recalculate analytics data";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
