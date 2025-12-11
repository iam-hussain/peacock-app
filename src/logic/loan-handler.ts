/* eslint-disable unused-imports/no-unused-vars */
import { Transaction } from "@prisma/client";

import prisma from "@/db";
import { newZoneDate } from "@/lib/date";
import {
  calculateInterestByAmount,
  setPassbookUpdateQuery,
} from "@/lib/helper";
import { LoanHistoryEntry, PassbookToUpdate } from "@/lib/type";

export function fetchLoanTransaction(accountId?: string | null) {
  return prisma.transaction.findMany({
    where: {
      ...(accountId
        ? { OR: [{ fromId: accountId }, { toId: accountId }] }
        : {}),
      transactionType: { in: ["LOAN_TAKEN", "LOAN_REPAY"] },
    },
    orderBy: { transactionAt: "asc" },
  });
}

export async function getLoanHistoryForMember(
  accountId: string
): Promise<LoanHistoryEntry[]> {
  const transactions = await fetchLoanTransaction(accountId);
  const loanTransaction = transactions.filter((e) =>
    ["LOAN_TAKEN", "LOAN_REPAY"].includes(e.transactionType)
  );

  // Group transactions by member (for LOAN_TAKEN, member is toId; for LOAN_REPAY, member is fromId)
  const memberTransactions: Transaction[] = [];
  loanTransaction.forEach((each) => {
    if (each.transactionType === "LOAN_TAKEN" && each.toId === accountId) {
      memberTransactions.push(each);
    } else if (each.transactionType === "LOAN_REPAY" && each.fromId === accountId) {
      memberTransactions.push(each);
    }
  });

  const { loanHistory } = calculateLoanDetails(memberTransactions);
  return loanHistory;
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
  return { loanHistory, totalLoanBalance: accountBalance };
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
    const { totalLoanBalance } = calculateLoanDetails(memTransactions);

    console.log(
      `Member ID: ${memberId}, Total Loan Balance: ${totalLoanBalance}`
    );

    // Note: loanHistory is now calculated dynamically, no longer stored in DB
  });

  return passbookToUpdate;
};

export function resetMemberLoanPassbookData(
  passbookToUpdate: PassbookToUpdate,
  memberId: string
): PassbookToUpdate {
  // const clubPassbook = passbookToUpdate.get("CLUB");
  const memberPassbook = passbookToUpdate.get(memberId);

  // const { totalLoanBalance = 0 } = memberPassbook?.data
  //   .payload as MemberPassbookData;

  // if (clubPassbook) {
  //   const { totalLoanBalance: clubTotalLoanBalance = 0 } = clubPassbook.data
  //     .payload as ClubPassbookData;
  //   // Update club passbook with the reverted loan data
  //   passbookToUpdate.set(
  //     "CLUB",
  //     setPassbookUpdateQuery(clubPassbook, {
  //       totalLoanBalance: clubTotalLoanBalance - totalLoanBalance,
  //     })
  //   );
  // }
  // Note: loanHistory is now calculated dynamically, no longer stored in DB
  return passbookToUpdate;
}
