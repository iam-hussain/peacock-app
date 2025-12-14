import { Prisma } from "@prisma/client";
import { endOfMonth, startOfMonth } from "date-fns";

import { clubConfig } from "@/lib/config/config";
import { calculateMonthsDifference } from "@/lib/core/date";
import { ClubFinancialSnapshot, PassbookToUpdate } from "@/lib/validators/type";

/**
 * Transforms club passbook data directly into a monthly snapshot entry
 * This is a simple transformation from club passbook to monthly snapshot format
 */
export async function calculateMonthlySnapshotFromPassbooks(
  monthStartDate: Date,
  allPassbooks: PassbookToUpdate,
  activeMembers: number,
  expectedTotalLoanInterestAmount: number
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
    const clubAgeMonths =
      calculateMonthsDifference(clubConfig.startedAt, monthEndDate) + 1;

    // Transform club passbook data to snapshot format
    const totalDeposits = clubData.memberPeriodicDepositsTotal || 0;
    const memberAdjustments = clubData.memberOffsetDepositsTotal || 0;
    const totalWithdrawals = clubData.memberWithdrawalsTotal || 0;
    const profitWithdrawals = clubData.memberProfitWithdrawalsTotal || 0;

    // Calculate member balance from member passbooks (sum of all member balances)
    let memberBalance =
      (clubData?.memberPeriodicDepositsTotal || 0) -
      (clubData?.memberWithdrawalsTotal || 0);
    // Loan data from club passbook
    const totalLoanGiven = clubData.loansPrincipalDisbursed || 0;
    const totalInterestCollected = clubData.interestCollectedTotal || 0;
    const currentLoanTaken = clubData.loansOutstanding || 0;

    // Calculate interest balance (expected interest - collected interest)
    const interestBalance = Math.max(
      0,
      expectedTotalLoanInterestAmount - totalInterestCollected
    );

    // Vendor data from club passbook
    const vendorInvestment = clubData.vendorInvestmentTotal || 0;
    const vendorReturns = clubData.vendorReturnsTotal || 0;
    const vendorProfit = Math.max(0, vendorReturns - vendorInvestment);

    const totalOffsetAmount = membersPassbooks
      .map((e) => e.joiningOffset + e.delayOffset)
      .reduce((a, b) => a + b, 0);

    const totalVendorHolding =
      clubData.vendorInvestmentTotal - clubData.vendorReturnsTotal;
    const totalInterestBalance =
      expectedTotalLoanInterestAmount - totalInterestCollected;
    const totalOffsetBalance =
      totalOffsetAmount || 0 - clubData.memberOffsetDepositsTotal || 0;

    // Calculate derived values using dashboard calculator formulas
    const totalInvested = currentLoanTaken + totalVendorHolding;
    const currentValue =
      totalDeposits +
      memberAdjustments +
      totalInterestCollected +
      vendorProfit -
      totalWithdrawals;
    const availableCash = clubData?.availableCashBalance || 0;
    const pendingAmounts = interestBalance + memberBalance;
    const totalPortfolioValue =
      (clubData?.availableCashBalance || 0) +
      (clubData?.loansOutstanding || 0) +
      (totalVendorHolding || 0) +
      (totalInterestBalance || 0) +
      (totalOffsetBalance || 0);

    // Return transformed snapshot
    return {
      monthStartDate: monthStart,
      monthEndDate,
      activeMembers,
      clubAgeMonths,
      totalDeposits,
      memberBalance,
      profitWithdrawals,
      memberAdjustments,
      totalLoanGiven,
      totalInterestCollected,
      currentLoanTaken,
      interestBalance,
      vendorInvestment,
      vendorProfit,
      totalInvested,
      pendingAmounts,
      availableCash,
      currentValue,
      totalPortfolioValue,
      recalculatedAt: new Date(),
    };
  } catch (error) {
    console.error(
      "Error transforming club passbook to monthly snapshot:",
      error
    );
    return null;
  }
}
