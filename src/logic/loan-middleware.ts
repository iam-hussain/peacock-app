/* eslint-disable unused-imports/no-unused-vars */
import { Transaction } from "@prisma/client";

import prisma from "@/db";
import {
  calculateInterestByAmount,
  setPassbookUpdateQuery,
} from "@/lib/helper";
import { LoanHistoryEntry, PassbookToUpdate } from "@/lib/type";

function fetchLoanTransaction(accountId?: string | null) {
  return prisma.transaction.findMany({
    where: {
      ...(accountId
        ? {
            OR: [{ fromId: accountId }, { toId: accountId }],
          }
        : {}),
      transactionType: { in: ["LOAN_TAKEN", "LOAN_REPAY"] },
    },
    orderBy: {
      transactionAt: "asc",
    },
  });
}

export function calculateInterest(transactions: Transaction[]) {
  let totalLoanTaken = 0;
  let totalLoanRepay = 0;
  let totalInterestPaid = 0;
  let accountBalance = 0;
  let recentLoanTakenDate: any = null;
  let recentLoanRepayDate: any = null;
  let totalInterestAmount = 0;

  let loanHistory: LoanHistoryEntry[] = [];

  transactions.forEach((transaction) => {
    const { transactionType, amount, transactionAt } = transaction;
    const transactionDate = new Date(transactionAt);

    if (transactionType === "LOAN_TAKEN") {
      totalLoanTaken += amount;
      accountBalance += amount;

      recentLoanRepayDate = transactionDate.toISOString().split("T")[0];
      recentLoanTakenDate = transactionDate.toISOString().split("T")[0];
    }
    if (transactionType === "LOAN_REPAY") {
      const {
        interestAmount,
        daysInMonth,
        daysPassed,
        monthsPassed,
        monthsPassedString,
        interestForDays,
        interestPerDay,
      } = calculateInterestByAmount(
        accountBalance,
        recentLoanRepayDate,
        transactionDate
      );

      totalInterestAmount += interestAmount;

      loanHistory.push({
        active: false,
        amount: accountBalance,
        recentLoanTakenDate,
        startDate: recentLoanRepayDate,
        endDate: new Date(transactionDate),
        totalInterestAmount,
        interestAmount,
        daysInMonth,
        daysPassed,
        monthsPassed,
        monthsPassedString,
        interestForDays,
        interestPerDay,
      });

      recentLoanRepayDate = transactionDate.toISOString().split("T")[0];

      accountBalance -= amount;
      totalLoanRepay += amount;
    }
    if (transactionType === "LOAN_INTEREST") {
      totalInterestPaid += amount;
    }
  });

  if (accountBalance > 0 && recentLoanRepayDate) {
    loanHistory.push({
      active: true,
      amount: accountBalance,
      recentLoanTakenDate,
      startDate: recentLoanRepayDate,
      totalInterestAmount,
    });
  }

  return {
    loanHistory,
    totalLoanTaken,
    totalLoanRepay,
    totalLoanBalance: accountBalance > 0 ? accountBalance : 0,
    totalInterestPaid,
  };
}

export const calculateLoansHandler = (
  passbookToUpdate: PassbookToUpdate,
  transaction: Transaction[]
) => {
  const loanTransaction = transaction.filter((e) =>
    ["LOAN_TAKEN", "LOAN_REPAY"].includes(e.transactionType)
  );
  const memberGroup: { [key in string]: Transaction[] } = {};

  loanTransaction.forEach((each) => {
    if (each.transactionType === "LOAN_TAKEN") {
      if (!memberGroup[each.toId]) {
        memberGroup[each.toId] = [];
      }

      memberGroup[each.toId].push(each);
    } else {
      if (!memberGroup[each.fromId]) {
        memberGroup[each.fromId] = [];
      }

      memberGroup[each.fromId].push(each);
    }
  });

  Object.entries(memberGroup).forEach(([memberId, memTransactions]) => {
    const { loanHistory, totalLoanBalance } =
      calculateInterest(memTransactions);

    const memberPassbook = passbookToUpdate.get(memberId);
    if (memberPassbook) {
      passbookToUpdate.set(
        memberId,
        setPassbookUpdateQuery(
          memberPassbook,
          { totalLoanBalance },
          { loanHistory }
        )
      );
    }
  });

  return passbookToUpdate;
};

export async function memberLoanMiddleware(
  passbookToUpdate: PassbookToUpdate,
  transaction: Transaction
) {
  let loanAccountId = transaction.fromId;

  if (transaction.transactionType === "LOAN_TAKEN") {
    loanAccountId = transaction.toId;
  }
  const transactions = await fetchLoanTransaction(loanAccountId);
  return calculateLoansHandler(passbookToUpdate, transactions);
}
