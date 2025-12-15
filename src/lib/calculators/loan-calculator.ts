import { Transaction } from "@prisma/client";
import { endOfMonth } from "date-fns";

import prisma from "@/db";
import { clubConfig } from "@/lib/config/config";
import { newZoneDate } from "@/lib/core/date";
import { calculateInterestByAmount } from "@/lib/helper";
import { LoanHistoryEntry } from "@/lib/validators/type";

/**
 * Fetches all loan transactions for a specific member
 */
export function fetchLoanTransactionsForMember(memberId: string) {
  return prisma.transaction
    .findMany({
      where: {
        OR: [{ fromId: memberId }, { toId: memberId }],
        type: { in: ["LOAN_TAKEN", "LOAN_REPAY"] },
      },
      orderBy: { occurredAt: "asc" },
    })
    .then((transactions) => {
      return transactions.filter((transaction) => {
        return (
          (transaction.type === "LOAN_TAKEN" &&
            transaction.toId === memberId) ||
          (transaction.type === "LOAN_REPAY" && transaction.fromId === memberId)
        );
      });
    });
}

/**
 * Creates a single loan history entry with interest calculation
 */
const getOneLoanDetails = (
  amount: number,
  start: Date | string,
  end: Date | string = newZoneDate()
): LoanHistoryEntry => {
  const data = calculateInterestByAmount(amount, start, end);
  return {
    active: false,
    amount,
    ...data,
    startDate: data.startDate.getTime(),
    endDate: data.endDate.getTime(),
  };
};

/**
 * Calculates loan history from an array of loan transactions
 * This is the core calculation logic that processes transactions chronologically
 */
export function calculateLoanDetails(transactions: Transaction[]) {
  const loanHistory: LoanHistoryEntry[] = [];
  let accountBalance = 0;
  let prevLoan: any = null;

  transactions.forEach((transaction) => {
    const { occurredAt, type: transactionType, amount } = transaction;

    if (transactionType === "LOAN_TAKEN") {
      if (prevLoan) {
        loanHistory.push(
          getOneLoanDetails(prevLoan.amount, prevLoan.startDate, occurredAt)
        );
      }
      accountBalance = accountBalance + amount;
      prevLoan = {
        active: true,
        amount: accountBalance,
        startDate: newZoneDate(occurredAt),
        transactionType,
      };
    } else if (transactionType === "LOAN_REPAY") {
      if (prevLoan) {
        loanHistory.push(
          getOneLoanDetails(accountBalance, prevLoan.startDate, occurredAt)
        );
        prevLoan = null;
      }
      accountBalance = accountBalance - amount;

      if (accountBalance > 0) {
        prevLoan = {
          active: true,
          amount: accountBalance,
          startDate: newZoneDate(occurredAt),
          transactionType,
        };
      }
    }
  });

  if (accountBalance > 0 && prevLoan) {
    loanHistory.push({
      active: true,
      amount: accountBalance,
      startDate: prevLoan.startDate.getTime(),
      interestAmount: 0,
    });
  }
  return { loanHistory, totalLoanBalance: accountBalance };
}

/**
 * Gets loan history for a member calculated on-the-fly from transactions
 * This replaces reading from passbook.loanHistory
 */
export async function getMemberLoanHistory(memberId: string) {
  const transactions = await fetchLoanTransactionsForMember(memberId);
  const { loanHistory, totalLoanBalance } = calculateLoanDetails(transactions);

  // Recalculate interest for each entry (same as transformLoanForTable does)
  // Use endOfMonth for consistency with expected interest calculation
  const clubStartDate = newZoneDate(clubConfig.startedAt);
  const currentMonthEnd = endOfMonth(newZoneDate());

  const loanHistoryResult = loanHistory.reduce(
    (acc, loan) => {
      // Use loan end date if available, otherwise use current month end (not current date)
      // This ensures consistency with expected interest calculation which uses monthEnd
      // Also ensure start date is not before club start date (same as expected calculation)
      const loanStartDate = loan.startDate
        ? newZoneDate(loan.startDate)
        : newZoneDate();
      const actualStartDate =
        loanStartDate < clubStartDate ? clubStartDate : loanStartDate;

      const loanEndDate = loan?.endDate
        ? newZoneDate(loan.endDate)
        : currentMonthEnd;

      const interestCalc = calculateInterestByAmount(
        loan.amount ?? 0,
        actualStartDate,
        loanEndDate
      );
      acc.totalInterestAmount += interestCalc.interestAmount;
      // Remove startDate and endDate from loan before spreading
      const { startDate: _startDate, endDate: _endDate } = loan;
      acc.loanHistory.push({
        ...interestCalc,
        amount: loan.amount ?? 0,
        active: !loan.endDate, // Loan is active if there's no end date
        startDate: newZoneDate(loan.startDate ?? newZoneDate()).getTime(),
        endDate: loan.endDate ? newZoneDate(loan.endDate).getTime() : undefined,
        totalInterestAmount: acc.totalInterestAmount,
      });
      // Store the most recent monthsPassedString
      if (interestCalc.monthsPassedString) {
        acc.recentPassedString = interestCalc.monthsPassedString;
      }
      return acc;
    },
    { totalInterestAmount: 0, loanHistory: [] as any[], recentPassedString: "" }
  );

  return {
    loanHistory: loanHistoryResult.loanHistory,
    totalLoanBalance,
    totalInterestAmount: loanHistoryResult.totalInterestAmount,
    recentPassedString: loanHistoryResult.recentPassedString,
  };
}
