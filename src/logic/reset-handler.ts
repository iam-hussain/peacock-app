/* eslint-disable unused-imports/no-unused-vars */

import { endOfMonth, startOfMonth } from "date-fns";

import { updatePassbookByTransaction } from "./transaction-handler";

import prisma from '@/db'
import { clearCache } from '@/lib/core/cache'
import { calculateMonthlySnapshotFromPassbooks } from '@/lib/calculators/dashboard-calculator'
import { calculateInterestByAmount } from '@/lib/helper'
import {
  bulkPassbookUpdate,
  fetchAllPassbook,
  initializePassbookToUpdate,
} from '@/lib/helper'
import { calculateLoanDetails } from '@/lib/calculators/loan-calculator'

export async function resetAllTransactionMiddlewareHandler(
  shouldUpdatePassbooks = true,
  shouldUpdateDashboard = true
) {
  clearCache()
  await prisma.summary.deleteMany()

  const [transactions, passbooks, activeMembers] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { transactionAt: "asc" } }),
    fetchAllPassbook(),
    prisma.account.count({ where: { isMember: true, active: true } }),
  ])

  let passbookToUpdate = initializePassbookToUpdate(passbooks, true)

  if (transactions.length === 0 && shouldUpdatePassbooks) {
    // No transactions, just update passbooks
    return bulkPassbookUpdate(passbookToUpdate);
  }

  // Group transactions by month
  const transactionsByMonth = new Map<string, typeof transactions>();

  transactions.forEach((tx) => {
    const monthKey = startOfMonth(tx.transactionAt).toISOString();
    if (!transactionsByMonth.has(monthKey)) {
      transactionsByMonth.set(monthKey, []);
    }
    transactionsByMonth.get(monthKey)!.push(tx);
  });

  // Get all member accounts for loan tracking
  const memberAccounts = await prisma.account.findMany({
    where: { isMember: true, active: true },
    select: { id: true },
  });
  const memberIds = new Set(memberAccounts.map((m) => m.id));

  // Process transactions month by month and calculate snapshots
  const months = Array.from(transactionsByMonth.keys()).sort();
  const monthlySnapshots: any[] = [];

  // Track loan transactions per member for interest calculation
  const memberLoanTransactions = new Map<string, typeof transactions>();

  for (const monthKey of months) {
    const monthTransactions = transactionsByMonth.get(monthKey)!;
    const monthStart = new Date(monthKey);
    const monthEnd = endOfMonth(monthStart);

    // Process all transactions for this month
    for (const transaction of monthTransactions) {
      passbookToUpdate = updatePassbookByTransaction(
        passbookToUpdate,
        transaction
      );

      // Track loan transactions for interest calculation
      // For LOAN_TAKEN: member is 'to' (receiving loan from club)
      // For LOAN_REPAY: member is 'from' (repaying to club)
      if (
        transaction.transactionType === "LOAN_TAKEN" &&
        memberIds.has(transaction.toId)
      ) {
        const memberId = transaction.toId;
        if (!memberLoanTransactions.has(memberId)) {
          memberLoanTransactions.set(memberId, []);
        }
        memberLoanTransactions.get(memberId)!.push(transaction);
      } else if (
        transaction.transactionType === "LOAN_REPAY" &&
        memberIds.has(transaction.fromId)
      ) {
        const memberId = transaction.fromId;
        if (!memberLoanTransactions.has(memberId)) {
          memberLoanTransactions.set(memberId, []);
        }
        memberLoanTransactions.get(memberId)!.push(transaction);
      }
    }

    // Calculate expected total loan interest amount from processed transactions
    let expectedTotalLoanInterestAmount = 0;
    for (const [memberId, loanTxs] of Array.from(
      memberLoanTransactions.entries()
    )) {
      // Filter transactions up to month end
      const transactionsUpToDate = loanTxs.filter(
        (tx: (typeof transactions)[0]) => tx.transactionAt <= monthEnd
      );

      if (transactionsUpToDate.length === 0) continue;

      // Calculate loan history from transactions
      const { loanHistory } = calculateLoanDetails(transactionsUpToDate);

      // Calculate interest for each loan entry
      for (const loan of loanHistory) {
        if (loan.active) {
          // Active loan - calculate interest up to month end
          // loan.startDate is a timestamp (number), convert to Date
          const startDate =
            typeof loan.startDate === "number"
              ? new Date(loan.startDate)
              : loan.startDate;
          const interestCalc = calculateInterestByAmount(
            loan.amount,
            startDate,
            monthEnd
          );
          expectedTotalLoanInterestAmount += interestCalc.interestAmount;
        } else if (loan.endDate) {
          // Completed loan - use the calculated interest
          const startDate =
            typeof loan.startDate === "number"
              ? new Date(loan.startDate)
              : loan.startDate;
          const endDate =
            typeof loan.endDate === "number"
              ? new Date(loan.endDate)
              : loan.endDate;
          const interestCalc = calculateInterestByAmount(
            loan.amount,
            startDate,
            endDate
          );
          expectedTotalLoanInterestAmount += interestCalc.interestAmount;
        }
      }
    }

    // After processing all transactions for this month, calculate snapshot
    const snapshot = await calculateMonthlySnapshotFromPassbooks(
      monthStart,
      passbookToUpdate,
      activeMembers,
      expectedTotalLoanInterestAmount
    );

    if (snapshot) {
      monthlySnapshots.push(snapshot);
    }
  }

  // Save all monthly snapshots
  if (monthlySnapshots.length > 0 && shouldUpdateDashboard) {
    await prisma.summary.createMany({
      data: monthlySnapshots,
    })
  }

  if (shouldUpdatePassbooks) {
    await bulkPassbookUpdate(passbookToUpdate)
  }
  return;
}
