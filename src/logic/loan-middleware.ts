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

const getOneLoanDetails = (
  amount: number,
  start: Date | string,
  end: Date | string = new Date()
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

export function calculateLoanDetails(transactions: Transaction[]) {
  const loanHistory: LoanHistoryEntry[] = [];
  let accountBalance = 0;
  let prevLoan: any = null;

  transactions.forEach((transaction) => {
    const { transactionAt, transactionType, amount } = transaction;

    if (transactionType === "LOAN_TAKEN") {
      if (prevLoan) {
        loanHistory.push(
          getOneLoanDetails(prevLoan.amount, prevLoan.startDate, transactionAt)
        );
      }
      prevLoan = {
        active: true,
        amount: accountBalance + amount,
        startDate: new Date(transactionAt),
        transactionType,
      };
      accountBalance = accountBalance + amount;
    } else if (transactionType === "LOAN_REPAY") {
      if (prevLoan) {
        loanHistory.push(
          getOneLoanDetails(accountBalance, prevLoan.startDate, transactionAt)
        );
        prevLoan = null;
      }
      accountBalance = accountBalance - amount;
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
  return {
    loanHistory,
    totalLoanBalance: accountBalance,
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
      calculateLoanDetails(memTransactions);

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
