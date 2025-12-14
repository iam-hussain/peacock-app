import prisma from "@/db";

/* ================================
   LOANS
================================ */
export type LoanLedgerEntry = {
  isActive?: boolean;
  active?: boolean; // Legacy support
  principalAmount?: number;
  amount?: number; // Legacy support

  startedAt?: Date | string | number;
  startDate?: Date | string | number; // Legacy support
  closedAt?: Date | string | number;
  endDate?: Date | string | number; // Legacy support

  accruedInterest?: number;
  interestAmount?: number; // Legacy support

  monthsElapsed?: number;
  monthsPassed?: number; // Legacy support

  daysElapsed?: number;
  daysPassed?: number; // Legacy support

  daysInPeriod?: number;
  daysInMonth?: number; // Legacy support

  interestPerDay?: number;
  interestAccruedForPeriod?: number;
  periodLabel?: string | null;
};

// Legacy alias for backward compatibility
export type LoanHistoryEntry = LoanLedgerEntry;

/* ================================
   MEMBER SNAPSHOT
================================ */
export type MemberFinancialSnapshot = {
  periodicDepositsTotal: number;
  offsetDepositsTotal: number;
  totalDeposits: number;

  withdrawalsTotal: number;
  profitWithdrawalsTotal: number;

  memberBalance: number;
  clubHeldBalance: number;

  loansPrincipalTaken: number;
  loansPrincipalRepaid: number;
  loansOutstanding: number;
  interestPaidTotal: number;
};

// Legacy alias for backward compatibility
export type MemberPassbookData = {
  periodicDepositAmount: number;
  offsetDepositAmount: number;
  totalDepositAmount: number;
  withdrawalAmount: number;
  profitWithdrawalAmount: number;
  accountBalance: number;
  clubHeldAmount: number;
  totalLoanTaken: number;
  totalLoanRepay: number;
  totalLoanBalance: number;
  totalInterestPaid: number;
};

/* ================================
   VENDOR SNAPSHOT
================================ */
export type VendorFinancialSnapshot = {
  investmentTotal: number;
  returnsTotal: number;
  currentBalance: number;
  profitTotal: number;
};

// Legacy alias for backward compatibility
export type VendorPassbookData = {
  totalInvestment: number;
  totalReturns: number;
  accountBalance: number;
  totalProfitAmount: number;
};

/* ================================
   CLUB SNAPSHOT
================================ */
export type ClubFinancialSnapshot = {
  memberPeriodicDepositsTotal: number;
  memberOffsetDepositsTotal: number;

  memberWithdrawalsTotal: number;
  memberProfitWithdrawalsTotal: number;

  availableCashBalance: number;
  netClubValue: number;

  vendorInvestmentTotal: number;
  vendorReturnsTotal: number;
  vendorProfitTotal: number;

  loansPrincipalDisbursed: number;
  loansPrincipalRepaid: number;
  loansOutstanding: number;
  interestCollectedTotal: number;
};

// Legacy alias for backward compatibility
export type ClubPassbookData = {
  totalMemberPeriodicDeposits: number;
  totalMemberOffsetDeposits: number;
  totalMemberWithdrawals: number;
  totalMemberProfitWithdrawals: number;
  currentClubBalance: number;
  netClubBalance: number;
  totalInvestment: number;
  totalReturns: number;
  totalProfit: number;
  totalLoanTaken: number;
  totalLoanRepay: number;
  totalLoanBalance: number;
  totalInterestPaid: number;
  totalVendorProfit: number;
};

/* ================================
   LEDGER UPDATE MAP
================================ */
export type LedgerUpdateMap = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;

// Legacy alias for backward compatibility
export type PassbookToUpdate = LedgerUpdateMap;
