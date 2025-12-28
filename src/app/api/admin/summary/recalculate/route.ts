export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/core/auth";
import { invalidateDashboardCaches } from "@/lib/core/cache-invalidation";
import { handleAuthError } from "@/lib/core/error-handler";
import { recalculateSchema } from "@/lib/validators/api-schemas";
import { recalculateSummary } from "@/logic/reset-handler";

/**
 * POST /api/admin/summary/recalculate
 * Recalculate all monthly summary snapshots (analytics)
 * Admin-only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    // Validate input with Zod
    const body = await request.json().catch(() => ({}));
    const validationResult = recalculateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const _force = validationResult.data.force;

    // Recalculate summary snapshots only
    // This is a long-running operation, so we'll let it complete
    await recalculateSummary();

    // Clear all caches after summary recalculation
    await invalidateDashboardCaches();

    return NextResponse.json({
      success: true,
      message: "Analytics data recalculated successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "FORBIDDEN_ADMIN" ||
        error.message === "UNAUTHORIZED"
      ) {
        return handleAuthError(error);
      }
    }

    console.error("Error recalculating summary:", error);

    // Return proper error response
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to recalculate analytics data";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
