export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";

import prisma from "@/db";
import { recomputeClubDashboardAggregates } from "@/lib/calculators/club-aggregates";
import { clubMonthsFromStart } from "@/lib/config/club";
import { transformClubPassbookToSummary } from "@/lib/transformers/dashboard-summary";
import {
  ClubFinancialSnapshot,
  VendorFinancialSnapshot,
} from "@/lib/validators/type";

/**
 * GET /api/dashboard/club-passbook
 * Get dashboard data from CLUB passbook - transforms ClubFinancialSnapshot to match summary structure
 * Returns structured financial data from Club passbook payload
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch club passbook
    const clubPassbook = await prisma.passbook.findFirst({
      where: { kind: "CLUB" },
      select: { payload: true, updatedAt: true },
    });

    if (!clubPassbook) {
      return NextResponse.json(
        {
          success: false,
          error:
            "CLUB passbook not found. Please run seed to initialize database.",
        },
        { status: 404 }
      );
    }

    let clubData = clubPassbook.payload as ClubFinancialSnapshot;

    // If the CLUB passbook was written before the derived-aggregates change,
    // it won't carry them yet. Recompute on demand so the dashboard renders
    // correctly even on first load after upgrade.
    if (clubData.aggregatesComputedAt === undefined) {
      const fresh = await recomputeClubDashboardAggregates();
      if (fresh) {
        clubData = { ...clubData, ...fresh };
      }
    }

    // Derived aggregates live on the CLUB passbook payload (refreshed after
    // every transaction via `recomputeClubDashboardAggregates`).
    const activeMembers = clubData.activeMembersCount ?? 0;
    const clubAgeMonths = clubMonthsFromStart();
    const expectedTotalLoanInterestAmount =
      clubData.expectedTotalLoanInterest ?? 0;
    const pendingAdjustments = clubData.pendingAdjustmentsTotal ?? 0;

    // Fetch vendor passbooks to calculate total vendor profit (still per-vendor)
    const vendorPassbooks = await prisma.passbook.findMany({
      where: { kind: "VENDOR" },
      select: {
        payload: true,
        account: { select: { active: true } },
      },
    });

    const summaryData = transformClubPassbookToSummary({
      clubData,
      activeMembers,
      clubAgeMonths,
      expectedTotalLoanInterestAmount,
      vendorPassbooks: vendorPassbooks.map((vp) => ({
        payload: vp.payload as VendorFinancialSnapshot,
        active: vp.account?.active ?? true,
      })),
      monthStartDate: null,
      monthEndDate: null,
      recalculatedAt: clubPassbook.updatedAt,
      recalculatedByAdminId: null,
      isLocked: false,
      pendingAdjustments,
      totalMemberPending: clubData.activeMemberPendingTotal ?? 0,
    });

    // Structure response according to financial domain semantics (matching summary structure)
    const response = {
      success: true,
      data: summaryData,
    };

    // Generate ETag from club passbook's updatedAt timestamp for cache validation
    const etag = `"${clubPassbook.updatedAt.getTime()}"`;

    // Check if client has cached version
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 }); // Not Modified
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, no-cache, must-revalidate", // Don't cache at CDN, but allow browser cache with validation
        ETag: etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error fetching club passbook:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch club passbook" },
      { status: 500 }
    );
  }
}
