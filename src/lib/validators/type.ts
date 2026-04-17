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
================================
 * Fields below the DERIVED AGGREGATES divider are NOT updated by the
 * transaction-handler DSL (`src/logic/settings.ts`). They depend on
 * member.active status and stage-based expected deposits, which sit
 * outside the per-transaction accumulator model. They are recomputed
 * via `recomputeClubDashboardAggregates` after every transaction write
 * and on reset.
 */
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

  /* ---------- DERIVED AGGREGATES (recomputed, not accumulated) ---------- */

  /** Count of currently-active members at snapshot time */
  activeMembersCount?: number;
  /** Expected periodic deposit per active member (from clubConfig stages) */
  memberTotalDepositExpected?: number;
  /** Σ over active members of (periodic + offset − profitWithdrawals) */
  activeMemberDepositedTotal?: number;
  /** Σ over active members of (memberTotalDeposit + joiningOffset + delayOffset − accountBalance) */
  activeMemberPendingTotal?: number;
  /** Σ of expected offsets for active members (joining + delay) */
  activeMemberExpectedAdjustments?: number;
  /** max(0, activeMemberExpectedAdjustments − memberOffsetDepositsTotal) */
  pendingAdjustmentsTotal?: number;
  /** Expected total loan interest on outstanding loans (time-weighted) */
  expectedTotalLoanInterest?: number;
  /** max(0, expectedTotalLoanInterest − interestCollectedTotal) */
  pendingLoanInterest?: number;
  /** ISO date string when aggregates were last recomputed */
  aggregatesComputedAt?: string;
};

/* ================================
   LEDGER UPDATE MAP
================================ */
export type LedgerUpdateMap = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;
