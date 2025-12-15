import { Prisma } from "@prisma/client";

import { getClubTotalDeposit } from "../config/club";

import {
  ClubFinancialSnapshot,
  VendorFinancialSnapshot,
} from "@/lib/validators/type";

/**
 * Dashboard summary response structure
 */
export type DashboardSummaryData = {
  // Members
  members: {
    activeMembers: number;
    clubAgeMonths: number;
  };
  // Member Funds
  memberFunds: {
    totalDeposits: number;
    memberBalance: number;
  };
  // Member Outflow
  memberOutflow: {
    profitWithdrawals: number;
    memberAdjustments: number;
    pendingAdjustments?: number; // Pending adjustments (expected - received)
  };
  // Loans - Lifetime
  loans: {
    lifetime: {
      totalLoanGiven: number;
      totalInterestCollected: number;
    };
    // Loans - Outstanding
    outstanding: {
      currentLoanTaken: number;
      interestBalance: number;
    };
  };
  // Vendor
  vendor: {
    vendorInvestment: number;
    vendorProfit: number;
  };
  // Cash Flow
  cashFlow: {
    totalInvested: number;
    pendingAmounts: number;
  };
  // Valuation
  valuation: {
    availableCash: number;
    currentValue: number;
  };
  // Portfolio
  portfolio: {
    totalPortfolioValue: number;
  };
  // System Metadata
  systemMeta: {
    monthStartDate: Date | null;
    monthEndDate: Date | null;
    recalculatedAt: Date;
    recalculatedByAdminId: string | null;
    isLocked: boolean;
  };
};

/**
 * Options for transforming club passbook to dashboard summary
 */
export type TransformClubPassbookOptions = {
  clubData: ClubFinancialSnapshot;
  activeMembers: number;
  clubAgeMonths: number;
  expectedTotalLoanInterestAmount?: number;
  vendorPassbooks?: Array<{ payload: VendorFinancialSnapshot }>;
  monthStartDate?: Date | null;
  monthEndDate?: Date | null;
  recalculatedAt?: Date;
  recalculatedByAdminId?: string | null;
  isLocked?: boolean;
  pendingAdjustments?: number; // Total expected adjustments - total received adjustments
};

/**
 * Transforms ClubFinancialSnapshot to dashboard summary structure
 * This is the common transformation logic used by both dashboard calculator and API routes
 */
export function transformClubPassbookToSummary(
  options: TransformClubPassbookOptions
): DashboardSummaryData {
  const {
    clubData,
    activeMembers,
    clubAgeMonths,
    expectedTotalLoanInterestAmount = 0,
    vendorPassbooks = [],
    monthStartDate = null,
    monthEndDate = null,
    recalculatedAt = new Date(),
    recalculatedByAdminId = null,
    isLocked = false,
  } = options;

  // Calculate total deposits (periodic only)
  const totalDeposits =
    getClubTotalDeposit(activeMembers, monthEndDate || new Date()) || 0;

  // Calculate member balance (deposits - withdrawals)
  const memberBalance = clubData.memberPeriodicDepositsTotal - totalDeposits;

  // Calculate interest balance (expected interest - collected interest)
  const interestBalance = Math.max(
    0,
    expectedTotalLoanInterestAmount - (clubData.interestCollectedTotal || 0)
  );

  // Calculate vendor profit by summing profits from each vendor passbook
  const vendorProfit = vendorPassbooks.reduce((total, vendorPassbook) => {
    const vendorData = vendorPassbook.payload as VendorFinancialSnapshot;
    const profit = vendorData.profitTotal || 0;
    return total + profit;
  }, 0);

  // Calculate vendor holding
  const totalVendorInvestment =
    (clubData.vendorInvestmentTotal || 0) -
    ((clubData.vendorReturnsTotal || 0) - vendorProfit);

  // Calculate total invested (outstanding loans + vendor holding)
  const totalInvested =
    (clubData.loansOutstanding || 0) + totalVendorInvestment;

  // Calculate pending amounts
  const pendingAdjustments = options?.pendingAdjustments || 0;
  const pendingAmounts = memberBalance + interestBalance + pendingAdjustments;

  // Calculate available cash
  const availableCash = clubData.availableCashBalance || 0;

  // Calculate current value
  const currentValue =
    (clubData.memberPeriodicDepositsTotal || 0) +
    (clubData.memberOffsetDepositsTotal || 0) +
    (clubData.interestCollectedTotal || 0) +
    vendorProfit -
    (clubData.memberWithdrawalsTotal || 0);

  // Calculate total portfolio value
  const totalPortfolioValue = currentValue + pendingAmounts;

  return {
    // Members
    members: {
      activeMembers,
      clubAgeMonths,
    },
    // Member Funds
    memberFunds: {
      totalDeposits,
      memberBalance,
    },
    // Member Outflow
    memberOutflow: {
      profitWithdrawals: clubData.memberProfitWithdrawalsTotal || 0,
      memberAdjustments: clubData.memberOffsetDepositsTotal || 0,
      pendingAdjustments: pendingAdjustments,
    },
    // Loans - Lifetime
    loans: {
      lifetime: {
        totalLoanGiven: clubData.loansPrincipalDisbursed || 0,
        // Use totalLoanInterestAmount from transactions instead of passbook value
        // because passbook may be reset during recalculation (isClean: true)
        totalInterestCollected: clubData.interestCollectedTotal || 0,
      },
      // Loans - Outstanding
      outstanding: {
        currentLoanTaken: clubData.loansOutstanding || 0,
        interestBalance,
      },
    },
    // Vendor
    vendor: {
      vendorInvestment: totalVendorInvestment,
      vendorProfit: vendorProfit || 0,
    },
    // Cash Flow
    cashFlow: {
      totalInvested,
      pendingAmounts,
    },
    // Valuation
    valuation: {
      availableCash,
      currentValue,
    },
    // Portfolio
    portfolio: {
      totalPortfolioValue,
    },
    // System Metadata
    systemMeta: {
      monthStartDate,
      monthEndDate,
      recalculatedAt,
      recalculatedByAdminId,
      isLocked,
    },
  };
}

/**
 * Transforms Prisma Summary model to dashboard summary structure
 */
export function transformSummaryToDashboardData(
  summary: Prisma.SummaryGetPayload<{}>
): DashboardSummaryData {
  return {
    // Members
    members: {
      activeMembers: summary.activeMembers,
      clubAgeMonths: summary.clubAgeMonths,
    },
    // Member Funds
    memberFunds: {
      totalDeposits: summary.totalDeposits,
      memberBalance: summary.memberBalance,
    },
    // Member Outflow
    memberOutflow: {
      profitWithdrawals: summary.profitWithdrawals,
      memberAdjustments: summary.memberAdjustments,
      pendingAdjustments: 0, // Summary table doesn't store pending, calculate if needed
    },
    // Loans - Lifetime
    loans: {
      lifetime: {
        totalLoanGiven: summary.totalLoanGiven,
        totalInterestCollected: summary.totalInterestCollected,
      },
      // Loans - Outstanding
      outstanding: {
        currentLoanTaken: summary.currentLoanTaken,
        interestBalance: summary.interestBalance,
      },
    },
    // Vendor
    vendor: {
      vendorInvestment: summary.vendorInvestment,
      vendorProfit: summary.vendorProfit,
    },
    // Cash Flow
    cashFlow: {
      totalInvested: summary.totalInvested,
      pendingAmounts: summary.pendingAmounts,
    },
    // Valuation
    valuation: {
      availableCash: summary.availableCash,
      currentValue: summary.currentValue,
    },
    // Portfolio
    portfolio: {
      totalPortfolioValue: summary.totalPortfolioValue,
    },
    // System Metadata
    systemMeta: {
      monthStartDate: summary.monthStartDate,
      monthEndDate: summary.monthEndDate,
      recalculatedAt: summary.recalculatedAt,
      recalculatedByAdminId: summary.recalculatedByAdminId,
      isLocked: summary.isLocked,
    },
  };
}
