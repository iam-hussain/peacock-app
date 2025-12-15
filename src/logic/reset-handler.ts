/* eslint-disable unused-imports/no-unused-vars */

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

export async function resetAllTransactionMiddlewareHandler(
  shouldUpdatePassbooks = true,
  shouldUpdateDashboard = true
) {
  clearCache();
  await prisma.summary.deleteMany();

  const [transactions, passbooks, activeAccounts] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { occurredAt: "asc" } }),
    fetchAllPassbook(),
    prisma.account.findMany({
      where: { type: "MEMBER", active: true },
      select: { id: true },
    }),
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

  // Cast passbooks to expected type for initializePassbookToUpdate
  let passbookToUpdate = initializePassbookToUpdate(passbooks as any, true);

  if (transactions.length === 0 && shouldUpdatePassbooks) {
    // No transactions, just update passbooks
    await bulkPassbookUpdate(passbookToUpdate);
    return;
  }

  // Group transactions by month
  const transactionsByMonth: Map<string, typeof transactions> = new Map();
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

  // Log transaction counts per month
  console.log(`📊 Transaction grouping validation:`);
  console.log(`   Total transactions: ${totalTransactionCount}`);
  console.log(`   Transactions grouped: ${groupedTransactionCount}`);
  console.log(`   Months with transactions: ${transactionsByMonth.size}`);

  // Log per-month counts (sorted chronologically for readability)
  const sortedMonthKeys = Array.from(transactionsByMonth.keys()).sort();
  sortedMonthKeys.forEach((monthKey) => {
    const monthTxs = transactionsByMonth.get(monthKey)!;
    const monthDate = new Date(monthKey);
    const monthLabel = monthDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
    console.log(`   ${monthLabel}: ${monthTxs.length} transactions`);
  });

  // Sort months chronologically
  const sortedMonths = sortedMonthKeys;

  // Monthly snapshots to create
  const monthlySnapshots: any[] = [];

  // Process each month
  for (const monthKey of sortedMonths) {
    const monthTransactions = transactionsByMonth.get(monthKey)!;
    const monthStart = new Date(monthKey);
    const monthEnd = isSameMonth(monthStart, new Date())
      ? new Date()
      : endOfMonth(monthStart); // if this month then new date else current month end

    // Process all transactions for this month
    for (const transaction of monthTransactions) {
      passbookToUpdate = updatePassbookByTransaction(
        passbookToUpdate,
        transaction
      );
    }

    // Create monthly snapshot if needed
    if (shouldUpdateDashboard) {
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
  if (monthlySnapshots.length > 0 && shouldUpdateDashboard) {
    await prisma.summary.createMany({
      data: monthlySnapshots,
    });
  }

  if (shouldUpdatePassbooks) {
    await bulkPassbookUpdate(passbookToUpdate);
  }

  clearCache();
}
