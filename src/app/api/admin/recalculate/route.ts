export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/core/auth";
import { invalidateDashboardCaches } from "@/lib/core/cache-invalidation";
import { recalculatePassbooks } from "@/logic/reset-handler";

export async function POST() {
  try {
    // Admin and super admin can recalculate passbooks
    await requireAdmin();

    // Recalculate passbooks only
    await recalculatePassbooks();

    // Clear all caches after recalculation
    await invalidateDashboardCaches();

    return NextResponse.json({ success: true });
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
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
