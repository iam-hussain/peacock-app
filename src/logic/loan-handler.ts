import { Transaction } from "@prisma/client";

import prisma from "@/db";
import { newZoneDate } from "@/lib/date";
import { calculateInterestByAmount } from "@/lib/helper";
import { LoanHistoryEntry } from "@/lib/type";

const LOAN_TRANSACTION_TYPES = ["LOAN_TAKEN", "LOAN_REPAY"] as const;

type LoanTransactionType = (typeof LOAN_TRANSACTION_TYPES)[number];

interface CurrentLoan {
  amount: number;
  startDate: Date;
  transactionType: LoanTransactionType;
}

/**
 * Fetches all loan-related transactions for a specific account or all accounts
 * @param accountId - Optional account ID to filter transactions
 * @returns Array of loan transactions ordered by transaction date
 */
export function fetchLoanTransactions(accountId?: string | null) {
  return prisma.transaction.findMany({
    where: {
      ...(accountId
        ? { OR: [{ fromId: accountId }, { toId: accountId }] }
        : {}),
      transactionType: { in: [...LOAN_TRANSACTION_TYPES] },
    },
    orderBy: { transactionAt: "asc" },
  });
}

/**
 * Calculates loan history for a specific member by fetching and processing their loan transactions
 * @param accountId - The account ID of the member
 * @returns Promise resolving to an array of loan history entries
 */
export async function getLoanHistoryForMember(
  accountId: string
): Promise<LoanHistoryEntry[]> {
  const transactions = await fetchLoanTransactions(accountId);

  // Filter and group transactions for this member
  const memberTransactions = transactions.filter((tx) => {
    if (tx.transactionType === "LOAN_TAKEN") {
      return tx.toId === accountId;
    }
    if (tx.transactionType === "LOAN_REPAY") {
      return tx.fromId === accountId;
    }
    return false;
  });

  const { loanHistory } = calculateLoanDetails(memberTransactions);
  return loanHistory;
}

/**
 * Calculates loan details for a completed loan period
 * @param amount - Loan amount
 * @param start - Start date of the loan
 * @param end - End date of the loan (defaults to current date)
 * @returns Loan history entry with calculated interest
 */
function calculateCompletedLoanDetails(
  amount: number,
  start: Date | string | number,
  end: Date | string | number = newZoneDate()
): LoanHistoryEntry {
  const interestData = calculateInterestByAmount(amount, start, end);
  return {
    active: false,
    amount,
    ...interestData,
    startDate: interestData.startDate.getTime(),
    endDate: interestData.endDate.getTime(),
  };
}

/**
 * Calculates loan history and total balance from a series of loan transactions
 * @param transactions - Array of loan transactions ordered by date
 * @returns Object containing loan history array and total loan balance
 */
export function calculateLoanDetails(transactions: Transaction[]) {
  const loanHistory: LoanHistoryEntry[] = [];
  let accountBalance = 0;
  let currentLoan: CurrentLoan | null = null;

  for (const transaction of transactions) {
    const { transactionAt, transactionType, amount } = transaction;

    if (transactionType === "LOAN_TAKEN") {
      // Close previous loan period if exists
      if (currentLoan) {
        loanHistory.push(
          calculateCompletedLoanDetails(
            currentLoan.amount,
            currentLoan.startDate,
            transactionAt
          )
        );
      }

      // Start new loan period
      accountBalance += amount;
      currentLoan = {
        amount: accountBalance,
        startDate: newZoneDate(transactionAt),
        transactionType,
      };
    } else if (transactionType === "LOAN_REPAY") {
      // Close current loan period
      if (currentLoan) {
        loanHistory.push(
          calculateCompletedLoanDetails(
            accountBalance,
            currentLoan.startDate,
            transactionAt
          )
        );
        currentLoan = null;
      }

      // Update balance and start new period if balance remains
      accountBalance -= amount;
      if (accountBalance > 0) {
        currentLoan = {
          amount: accountBalance,
          startDate: newZoneDate(transactionAt),
          transactionType,
        };
      }
    }
  }

  // Add active loan if balance remains
  if (accountBalance > 0 && currentLoan) {
    loanHistory.push({
      active: true,
      amount: accountBalance,
      startDate: currentLoan.startDate.getTime(),
      interestAmount: 0,
    });
  }

  return { loanHistory, totalLoanBalance: accountBalance };
}

/**
 * Groups loan transactions by member and calculates loan balances
 * Note: This function is kept for backward compatibility but loanHistory
 * is now calculated dynamically and not stored in the database
 * @param passbookToUpdate - Map of passbooks to update
 * @param transactions - Array of all transactions to process
 * @returns Updated passbook map (no longer modifies loanHistory)
 */
export function calculateLoansHandler(
  passbookToUpdate: Map<string, unknown>,
  transactions: Transaction[]
) {
  const loanTransactions = transactions.filter((tx) =>
    LOAN_TRANSACTION_TYPES.includes(tx.transactionType as LoanTransactionType)
  );

  // Group transactions by member
  const memberGroups = new Map<string, Transaction[]>();
  for (const tx of loanTransactions) {
    const memberId = tx.transactionType === "LOAN_TAKEN" ? tx.toId : tx.fromId;
    const group = memberGroups.get(memberId) || [];
    group.push(tx);
    memberGroups.set(memberId, group);
  }

  // Calculate balances for each member (for logging/debugging)
  memberGroups.forEach((memberTransactions, memberId) => {
    const { totalLoanBalance } = calculateLoanDetails(memberTransactions);
    console.log(
      `Member ID: ${memberId}, Total Loan Balance: ${totalLoanBalance}`
    );
  });

  return passbookToUpdate;
}
