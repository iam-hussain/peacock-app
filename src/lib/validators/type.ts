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

/**
 * Legacy type for loan history entries
 * @deprecated Use LoanLedgerEntry instead. This type is maintained for backward compatibility.
 *
 * Represents a single entry in a member's loan history, tracking the loan's status,
 * principal amount, dates, and interest calculations.
 */
export type LoanHistoryEntry = {
  /** Indicates if the loan is currently active */
  active: boolean;
  /** Principal amount of the loan */
  amount: number;
  /** Date the loan started */
  startDate: Date | string | number;
  /** Optional end date if the loan has been repaid */
  endDate?: Date | string | number;
  /** Current interest amount accrued on the loan */
  interestAmount?: number;
  /** Number of months passed since the loan started */
  monthsPassed?: number;
  /** Number of days passed since the last monthly update */
  daysPassed?: number;
  /** Number of days in the current month/period */
  daysInMonth?: number;
  /** String representation of months passed (e.g., "3 months") */
  monthsPassedString?: string | null;
  /** Interest amount calculated for the current days period */
  interestForDays?: number;
  /** Daily interest rate for the loan */
  interestPerDay?: number;
};

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

/**
 * Legacy type for member passbook data
 * @deprecated Use MemberFinancialSnapshot instead. This type is maintained for backward compatibility.
 *
 * Represents data for a member's passbook, tracking deposits, withdrawals, balances, and offsets.
 */
export type MemberPassbookData = {
  /** Total amount periodically deposited by the member */
  periodicDepositAmount: number;
  /** Amount deposited for offset purposes by the member */
  offsetDepositAmount: number;
  /** Sum of all deposits made by the member */
  totalDepositAmount: number;
  /** Total amount withdrawn by the member */
  withdrawalAmount: number;
  /** Total amount withdrawn as profit by the member */
  profitWithdrawalAmount: number;
  /** Current balance in the member's account */
  accountBalance: number;
  /** Portion of the member's balance that belongs to the club */
  clubHeldAmount: number;
  /** Total amount of loans taken by the member */
  totalLoanTaken: number;
  /** Total amount of loans repaid by the member */
  totalLoanRepay: number;
  /** Current balance of outstanding loans */
  totalLoanBalance: number;
  /** Total interest paid by the member on loans */
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

/**
 * Legacy type for vendor passbook data
 * @deprecated Use VendorFinancialSnapshot instead. This type is maintained for backward compatibility.
 *
 * Represents data for a vendor's passbook, tracking investments and returns.
 */
export type VendorPassbookData = {
  /** Total amount invested by the vendor */
  totalInvestment: number;
  /** Total amount returned to the vendor */
  totalReturns: number;
  /** Current balance in the vendor's account */
  accountBalance: number;
  /** Profit earned from the vendor's investments */
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

/**
 * Legacy type for club passbook data
 * @deprecated Use ClubFinancialSnapshot instead. This type is maintained for backward compatibility.
 *
 * Represents data for the club's passbook, tracking overall deposits, withdrawals, balances,
 * investments, profits, and offsets.
 */
export type ClubPassbookData = {
  /** Total periodic deposits from all members to the club */
  totalMemberPeriodicDeposits: number;
  /** Total offset deposits from all members to the club */
  totalMemberOffsetDeposits: number;
  /** Total amount withdrawn by members from the club */
  totalMemberWithdrawals: number;
  /** Total amount withdrawn as profit by members from the club */
  totalMemberProfitWithdrawals: number;
  /** Current balance available in the club */
  currentClubBalance: number;
  /** Net balance considering all deposits, withdrawals, and offsets */
  netClubBalance: number;
  /** Total amount invested by all vendors in the club */
  totalInvestment: number;
  /** Total returns accumulated by the club from investments */
  totalReturns: number;
  /** Total profit earned by the club from all investments */
  totalProfit: number;
  /** Total amount of loans taken by members */
  totalLoanTaken: number;
  /** Total amount of loans repaid by members */
  totalLoanRepay: number;
  /** Current balance of outstanding loans */
  totalLoanBalance: number;
  /** Total interest paid by members on loans */
  totalInterestPaid: number;
  /** Total profit earned by the club from vendor-related activities (calculated separately) */
  totalVendorProfit: number;
};

/* ================================
   LEDGER UPDATE MAP
================================ */
export type LedgerUpdateMap = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;

/**
 * Legacy type for passbook update map
 * @deprecated Use LedgerUpdateMap instead. This type is maintained for backward compatibility.
 *
 * Represents a map of passbook IDs to their update parameters for batch updates.
 * The key is the passbook ID (string), and the value is the update parameters
 * compatible with Prisma's passbook.update method.
 */
export type PassbookToUpdate = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;
