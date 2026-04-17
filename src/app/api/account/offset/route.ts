export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { recomputeClubDashboardAggregates } from "@/lib/calculators/club-aggregates";
import { invalidateAccountCaches } from "@/lib/core/cache-invalidation";

// POST Request to update the member's offset adjustments
// Only admins can adjust member offsets (Write users cannot edit members)
export async function POST(request: Request) {
  try {
    const { requireAdmin } = await import("@/lib/core/auth");
    await requireAdmin();

    const { passbookId, joiningOffset, delayOffset } = await request.json();

    if (!passbookId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    await prisma.passbook.update({
      where: {
        id: passbookId,
      },
      data: {
        joiningOffset,
        delayOffset,
      },
    });

    // Offsets change the active-member pending/adjustments aggregates but
    // can't affect loan interest — skip the expensive loan-history recompute.
    try {
      await recomputeClubDashboardAggregates(prisma, {
        skipLoanInterest: true,
      });
    } catch (aggregateError) {
      console.error(
        "⚠️  Failed to recompute club dashboard aggregates after offset update",
        aggregateError
      );
    }

    // Clear all caches after offset update
    await invalidateAccountCaches();

    return NextResponse.json({ joiningOffset, delayOffset });
  } catch (error: any) {
    console.error("Error updating offsets:", error);
    if (
      error.message === "Unauthorized" ||
      error.message.includes("Forbidden")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update offsets" },
      { status: 500 }
    );
  }
}
