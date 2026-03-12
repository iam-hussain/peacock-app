/* eslint-disable unused-imports/no-unused-vars */

import { Transaction } from "@prisma/client";
import {
  eachMonthOfInterval,
  endOfMonth,
  isSameMonth,
  startOfMonth,
} from "date-fns";

import { updatePassbookByTransaction } from "./transaction-handler";

import prisma from "@/db";
import { calculateMonthlySnapshotFromPassbooks } from "@/lib/calculators/dashboard-calculator";
import { calculateExpectedTotalLoanInterestAmountFromTransactions } from "@/lib/calculators/expected-interest";
import { clubConfig } from "@/lib/config/config";
import { clearCache } from "@/lib/core/cache";
import {
  bulkPassbookUpdate,
  fetchAllPassbook,
  initializePassbookToUpdate,
} from "@/lib/helper";

type SummaryCreateManyArgs = NonNullable<
  Parameters<typeof prisma.summary.createMany>[0]
>;

/**
 * Helper function to group transactions by month
 */
function groupTransactionsByMonth(transactions: Transaction[]) {
  const transactionsByMonth: Map<string, Transaction[]> = new Map();
  const totalTransactionCount = transactions.length;

  const clubStartDate = clubConfig.startedAt;
  const clubCurrentDate = new Date();

  // Extract all months between clubStartDate and clubCurrentDate
  const startMonth = startOfMonth(clubStartDate);
  const endMonth = startOfMonth(clubCurrentDate);
  const allMonths = eachMonthOfInterval({
    start: startMonth,
    end: endMonth,
  });

  // Initialize transactionsByMonth with all months (empty arrays)
  allMonths.forEach((month) => {
    const monthKey = month.toISOString();
    transactionsByMonth.set(monthKey, []);
  });

  // Populate transactionsByMonth with actual transactions
  transactions.forEach((tx) => {
    const monthKey = startOfMonth(tx.occurredAt).toISOString();
    if (transactionsByMonth.has(monthKey)) {
      transactionsByMonth.get(monthKey)!.push(tx);
    } else {
      // If transaction is outside the expected range, still add it
      // (this handles edge cases where transactions exist before club start)
      if (!transactionsByMonth.has(monthKey)) {
        transactionsByMonth.set(monthKey, []);
      }
      transactionsByMonth.get(monthKey)!.push(tx);
    }
  });

  // Validate: Ensure no transactions were lost during grouping
  const groupedTransactionCount = Array.from(
    transactionsByMonth.values()
  ).reduce((sum, monthTxs) => sum + monthTxs.length, 0);

  if (totalTransactionCount !== groupedTransactionCount) {
    console.error(
      `❌ TRANSACTION COUNT MISMATCH: ` +
        `Total: ${totalTransactionCount}, Grouped: ${groupedTransactionCount}, ` +
        `Missing: ${totalTransactionCount - groupedTransactionCount}`
    );
    throw new Error(
      `Transaction grouping failed: ${totalTransactionCount} transactions input, ` +
        `${groupedTransactionCount} transactions grouped. ` +
        `${totalTransactionCount - groupedTransactionCount} transactions missing!`
    );
  }

  const sortedMonthKeys = Array.from(transactionsByMonth.keys()).sort();

  return { transactionsByMonth, sortedMonthKeys };
}

/**
 * Core function that processes transactions grouped by month,
 * updating passbooks and optionally building monthly summary snapshots.
 */
async function processTransactionsForPassbooks(options: {
  updatePassbooks: boolean;
  updateSummary: boolean;
}) {
  clearCache();

  if (options.updateSummary) {
    await prisma.summary.deleteMany();
  }

  const [transactions, passbooks, activeAccounts] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { occurredAt: "asc" } }),
    fetchAllPassbook(),
    options.updateSummary
      ? prisma.account.findMany({
          where: { type: "MEMBER", active: true },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const activeMemberCount = activeAccounts.length;
  const activeMemberIds = activeAccounts.map((account) => account.id);

  const activeMemberPassbooks = passbooks.filter((passbook) =>
    activeMemberIds.includes(passbook.account?.id || "")
  );
  const totalActiveMemberAdjustments = activeMemberPassbooks.reduce(
    (sum, passbook) =>
      sum +
      (Number(passbook.joiningOffset) || 0) +
      (Number(passbook.delayOffset) || 0),
    0
  );

  // Initialize passbook update map
  let passbookToUpdate = initializePassbookToUpdate(passbooks, true);

  if (transactions.length === 0) {
    if (options.updatePassbooks) {
      await bulkPassbookUpdate(passbookToUpdate);
    }
    clearCache();
    return;
  }

  // Group transactions by month
  const { transactionsByMonth, sortedMonthKeys } =
    groupTransactionsByMonth(transactions);

  // Monthly snapshots to create
  const monthlySnapshots: SummaryCreateManyArgs["data"] = [];

  // Process each month
  for (const monthKey of sortedMonthKeys) {
    const monthTransactions = transactionsByMonth.get(monthKey)!;
    const monthStart = new Date(monthKey);
    const monthEnd = isSameMonth(monthStart, new Date())
      ? new Date()
      : endOfMonth(monthStart);

    // Process all transactions for this month
    for (const transaction of monthTransactions) {
      passbookToUpdate = updatePassbookByTransaction(
        passbookToUpdate,
        transaction
      );
    }

    // Create monthly snapshot if needed
    if (options.updateSummary) {
      const currentMonthTransactions = transactions.filter(
        (tx) => tx.occurredAt <= monthEnd
      );

      // Calculate expected total loan interest amount from existing transactions
      // Filter transactions to only include those up to this month's end date
      // This avoids fetching from database multiple times
      const { expectedTotalLoanInterestAmount } =
        calculateExpectedTotalLoanInterestAmountFromTransactions(
          currentMonthTransactions,
          monthEnd
        );

      const snapshot = await calculateMonthlySnapshotFromPassbooks(
        monthStart,
        passbookToUpdate,
        activeMemberCount,
        expectedTotalLoanInterestAmount,
        totalActiveMemberAdjustments
      );
      if (snapshot) {
        monthlySnapshots.push(snapshot);
      }
    }
  }

  // Bulk insert monthly snapshots
  if (monthlySnapshots.length > 0 && options.updateSummary) {
    await prisma.summary.createMany({
      data: monthlySnapshots,
    });
  }

  if (options.updatePassbooks) {
    await bulkPassbookUpdate(passbookToUpdate);
  }

  clearCache();
}

/**
 * Recalculate passbooks only
 * Processes all transactions and updates passbook data
 */
export async function recalculatePassbooks() {
  return processTransactionsForPassbooks({
    updatePassbooks: true,
    updateSummary: false,
  });
}

/**
 * Recalculate summary snapshots only
 * Processes all transactions and creates monthly summary snapshots
 */
export async function recalculateSummary() {
  return processTransactionsForPassbooks({
    updatePassbooks: false,
    updateSummary: true,
  });
}

/**
 * Recalculate both passbooks and summary (analytics)
 * This is the combined function that does both operations
 */
export async function resetAllTransactionMiddlewareHandler(
  shouldUpdatePassbooks = true,
  shouldUpdateDashboard = true
) {
  return processTransactionsForPassbooks({
    updatePassbooks: shouldUpdatePassbooks,
    updateSummary: shouldUpdateDashboard,
  });
}
