/* eslint-disable unused-imports/no-unused-vars */
import { Transaction } from "@prisma/client";

import prisma from "@/db";
import { newZoneDate } from "@/lib/date";
import {
  calculateInterestByAmount,
  initializePassbookToUpdate,
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
      accountBalance = accountBalance + amount;
      prevLoan = {
        active: true,
        amount: accountBalance,
        startDate: newZoneDate(transactionAt),
        transactionType,
      };
    } else if (transactionType === "LOAN_REPAY") {
      if (prevLoan) {
        loanHistory.push(
          getOneLoanDetails(accountBalance, prevLoan.startDate, transactionAt)
        );
        prevLoan = null;
      }
      accountBalance = accountBalance - amount;

      if (accountBalance > 0) {
        prevLoan = {
          active: true,
          amount: accountBalance,
          startDate: newZoneDate(transactionAt),
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

export async function recalculateMemberLoanById(memberId: string) {
  const [passbook, transactions] = await Promise.all([
    prisma.passbook.findFirstOrThrow({
      where: {
        account: {
          id: memberId,
        },
      },
      select: {
        id: true,
        type: true,
        payload: true,
        account: {
          select: {
            id: true,
          },
        },
      },
    }),
    fetchLoanTransaction(),
  ]);
  let passbookToUpdate = initializePassbookToUpdate([passbook], false);
  return calculateLoansHandler(passbookToUpdate, transactions);
}
