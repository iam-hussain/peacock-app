import { Prisma } from "@prisma/client";
import { endOfMonth, startOfMonth } from "date-fns";

import { clubMonthsFromStart } from "@/lib/config/club";
import {
  calculateExpectedTotalLoanInterestAmount,
} from "@/lib/calculators/expected-interest";
import { transformClubPassbookToSummary } from "@/lib/transformers/dashboard-summary";
import {
  ClubFinancialSnapshot,
  PassbookToUpdate,
  VendorFinancialSnapshot,
} from "@/lib/validators/type";

/**
 * Transforms club passbook data directly into a monthly snapshot entry
 * This is a simple transformation from club passbook to monthly snapshot format
 */
export async function calculateMonthlySnapshotFromPassbooks(
  monthStartDate: Date,
  allPassbooks: PassbookToUpdate,
  activeMembers: number,
  expectedTotalLoanInterestAmount?: number,
): Promise<Prisma.SummaryCreateInput | null> {
  try {
    const clubPassbook = allPassbooks.get("CLUB");
    let membersPassbooks: any[] = [];
    const memberEntry = allPassbooks.get("MEMBER");
    if (Array.isArray(memberEntry)) {
      membersPassbooks = memberEntry.map((e: any) => e.data.payload);
    }
    const monthEndDate = endOfMonth(monthStartDate);
    const monthStart = startOfMonth(monthStartDate);

    if (!clubPassbook || !clubPassbook.data?.payload) {
      return null;
    }

    const clubData = clubPassbook.data.payload as ClubFinancialSnapshot;

    // Calculate club age
    const clubAgeMonths = clubMonthsFromStart(monthEndDate);

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

    // Transform club passbook to summary structure using common transformer
    // Debug: Log values being passed
    if (clubData.interestCollectedTotal === 0) {
      console.warn(
        `⚠️  Snapshot for ${monthStart.toISOString().split('T')[0]}: ` +
        `clubData.interestCollectedTotal=${clubData.interestCollectedTotal}`
      );
    }

    const summaryData = transformClubPassbookToSummary({
      clubData,
      activeMembers,
      clubAgeMonths,
      expectedTotalLoanInterestAmount,
      totalLoanInterestAmount: clubData.interestCollectedTotal || 0,
      vendorPassbooks,
      monthStartDate: monthStart,
      monthEndDate,
      recalculatedAt: new Date(),
    });

    // Return transformed snapshot (mapping summary structure to Prisma Summary format)
    return {
      monthStartDate: monthStart,
      monthEndDate,
      activeMembers: summaryData.members.activeMembers,
      clubAgeMonths: summaryData.members.clubAgeMonths,
      totalDeposits: summaryData.memberFunds.totalDeposits,
      memberBalance: summaryData.memberFunds.memberBalance,
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
