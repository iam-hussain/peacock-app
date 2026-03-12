import prisma from "@/db";

/* ================================
   LOANS
================================ */

/**
 * Represents a single entry in a member's loan history, tracking the loan's status,
 * principal amount, dates, and interest calculations.
 */
export type LoanHistoryEntry = {
  index: number;
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

/* ================================
   VENDOR SNAPSHOT
================================ */
export type VendorFinancialSnapshot = {
  investmentTotal: number;
  returnsTotal: number;
  currentBalance: number;
  profitTotal: number;
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

/* ================================
   LEDGER UPDATE MAP
================================ */
export type LedgerUpdateMap = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;
