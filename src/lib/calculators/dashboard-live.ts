import prisma from "@/db";
import { recomputeClubDashboardAggregates } from "@/lib/calculators/club-aggregates";
import { clubMonthsFromStart } from "@/lib/config/club";
import {
  DashboardSummaryData,
  transformClubPassbookToSummary,
} from "@/lib/transformers/dashboard-summary";
import {
  ClubFinancialSnapshot,
  VendorFinancialSnapshot,
} from "@/lib/validators/type";

type LiveDashboardResult =
  | { success: true; data: DashboardSummaryData; etag: string }
  | { success: false; error: string };

/**
 * Shared live-data computation used by both /api/dashboard/summary
 * (when no month param) and /api/dashboard/club-passbook. Returns
 * identical output to keep the dashboard's data-source toggle a
 * pure UX choice rather than two subtly different calculations.
 */
export async function computeLiveDashboard(): Promise<LiveDashboardResult> {
  const [clubPassbook, vendorPassbooks] = await Promise.all([
    prisma.passbook.findFirst({
      where: { kind: "CLUB" },
      select: { payload: true, updatedAt: true },
    }),
    prisma.passbook.findMany({
      where: { kind: "VENDOR" },
      select: {
        payload: true,
        account: { select: { active: true } },
      },
    }),
  ]);

  if (!clubPassbook) {
    return {
      success: false,
      error: "No dashboard data found. Please run recalculation first.",
    };
  }

  let clubData = clubPassbook.payload as ClubFinancialSnapshot;

  // Backfill derived aggregates on first load after upgrade.
  if (clubData.aggregatesComputedAt === undefined) {
    const fresh = await recomputeClubDashboardAggregates();
    if (fresh) {
      clubData = { ...clubData, ...fresh };
    }
  }

  const data = transformClubPassbookToSummary({
    clubData,
    activeMembers: clubData.activeMembersCount ?? 0,
    clubAgeMonths: clubMonthsFromStart(),
    expectedTotalLoanInterestAmount: clubData.expectedTotalLoanInterest ?? 0,
    vendorPassbooks: vendorPassbooks.map((vp) => ({
      payload: vp.payload as VendorFinancialSnapshot,
      active: vp.account?.active ?? true,
    })),
    monthStartDate: null,
    monthEndDate: null,
    recalculatedAt: clubPassbook.updatedAt,
    recalculatedByAdminId: null,
    isLocked: false,
    pendingAdjustments: clubData.pendingAdjustmentsTotal ?? 0,
    totalMemberPending: clubData.activeMemberPendingTotal ?? 0,
  });

  return {
    success: true,
    data,
    etag: `"${clubPassbook.updatedAt.getTime()}"`,
  };
}
