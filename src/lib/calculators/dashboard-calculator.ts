import { Prisma } from "@prisma/client";
import { endOfMonth, startOfMonth } from "date-fns";

import { clubMonthsFromStart, getMemberTotalDeposit } from "@/lib/config/club";
import { transformClubPassbookToSummary } from "@/lib/transformers/dashboard-summary";
import {
  ClubFinancialSnapshot,
  LedgerUpdateMap,
  MemberFinancialSnapshot,
  VendorFinancialSnapshot,
} from "@/lib/validators/type";

/**
 * Transforms club passbook data directly into a monthly snapshot entry
 * This is a simple transformation from club passbook to monthly snapshot format
 */
export async function calculateMonthlySnapshotFromPassbooks(
  monthStartDate: Date,
  allPassbooks: LedgerUpdateMap,
  activeMembers: number,
  expectedTotalLoanInterestAmount: number,
  totalActiveMemberAdjustments: number,
  activeMemberOffsets: Map<
    string,
    { joiningOffset: number; delayOffset: number }
  > = new Map()
): Promise<Prisma.SummaryCreateInput | null> {
  try {
    const clubPassbook = allPassbooks.get("CLUB");

    const monthEndDate =
      endOfMonth(monthStartDate) > new Date()
        ? new Date()
        : endOfMonth(monthStartDate);
    const monthStart = startOfMonth(monthStartDate);

    if (!clubPassbook || !clubPassbook.data?.payload) {
      return null;
    }

    const clubData = clubPassbook.data.payload as ClubFinancialSnapshot;

    const pendingAdjustments =
      totalActiveMemberAdjustments - (clubData.memberOffsetDepositsTotal || 0);

    // Calculate club age
    const clubAgeMonths = clubMonthsFromStart(monthEndDate);

    // Sum per-active-member values from their MEMBER passbooks in the map.
    //   totalMemberPending = Σ (memberTotalDeposit + joiningOffset + delayOffset
    //                         − (periodicDepositsTotal + offsetDepositsTotal))
    //                       = expected contributions − actual contributions
    const memberTotalDeposit = getMemberTotalDeposit(monthEndDate);
    const activeMemberTotals = Array.from(allPassbooks.entries()).reduce(
      (acc, [key, entry]) => {
        if (key === "CLUB" || entry?.data?.kind !== "MEMBER") return acc;
        const offsets = activeMemberOffsets.get(key);
        if (!offsets) return acc; // not an active member
        const payload = (entry.data.payload ||
          {}) as MemberFinancialSnapshot & {
          periodicDepositAmount?: number;
          offsetDepositAmount?: number;
        };
        const periodicDeposits =
          payload.periodicDepositsTotal ?? payload.periodicDepositAmount ?? 0;
        const offsetDeposits =
          payload.offsetDepositsTotal ?? payload.offsetDepositAmount ?? 0;
        const totalOffset =
          (offsets.joiningOffset || 0) + (offsets.delayOffset || 0);
        const actualContributions = periodicDeposits + offsetDeposits;
        return {
          pending:
            acc.pending +
            memberTotalDeposit +
            totalOffset -
            actualContributions,
        };
      },
      { pending: 0 }
    );

    // Extract vendor passbooks from allPassbooks
    const vendorPassbooks = Array.from(allPassbooks.entries())
      .filter(([key, entry]) => {
        // Check if this is a vendor passbook (not CLUB, not MEMBER array)
        if (key === "CLUB") return false;
        if (key === "MEMBER") return false;
        // Individual vendor entries have account IDs as keys
        return entry?.data?.kind === "VENDOR";
      })
      .map(([_, entry]) => ({
        payload: entry.data.payload as VendorFinancialSnapshot,
      }));

    const summaryData = transformClubPassbookToSummary({
      clubData,
      activeMembers,
      clubAgeMonths,
      expectedTotalLoanInterestAmount,
      vendorPassbooks,
      monthStartDate: monthStart,
      monthEndDate,
      recalculatedAt: new Date(),
      pendingAdjustments,
      totalMemberPending: activeMemberTotals.pending,
    });

    // Return transformed snapshot (mapping summary structure to Prisma Summary format)
    return {
      monthStartDate: monthStart,
      monthEndDate,
      activeMembers: summaryData.members.activeMembers,
      clubAgeMonths: summaryData.members.clubAgeMonths,
      totalDeposits: summaryData.memberFunds.totalDeposits,
      memberDepositsPaid: summaryData.memberFunds.memberDepositsPaid,
      memberBalance: summaryData.memberFunds.memberBalance,
      totalMemberPending: summaryData.memberFunds.totalMemberPending,
      profitWithdrawals: summaryData.memberOutflow.profitWithdrawals,
      memberAdjustments: summaryData.memberOutflow.memberAdjustments,
      totalLoanGiven: summaryData.loans.lifetime.totalLoanGiven,
      totalInterestCollected: summaryData.loans.lifetime.totalInterestCollected,
      currentLoanTaken: summaryData.loans.outstanding.currentLoanTaken,
      interestBalance: summaryData.loans.outstanding.interestBalance,
      vendorInvestment: summaryData.vendor.vendorInvestment,
      vendorProfit: summaryData.vendor.vendorProfit,
      totalInvested: summaryData.cashFlow.totalInvested,
      pendingAmounts: summaryData.cashFlow.pendingAmounts,
      availableCash: summaryData.valuation.availableCash,
      currentValue: summaryData.valuation.currentValue,
      totalPortfolioValue: summaryData.portfolio.totalPortfolioValue,
      recalculatedAt: summaryData.systemMeta.recalculatedAt,
    };
  } catch (error) {
    console.error(
      "Error transforming club passbook to monthly snapshot:",
      error
    );
    return null;
  }
}
