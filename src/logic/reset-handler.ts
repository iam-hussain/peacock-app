/* eslint-disable unused-imports/no-unused-vars */

import { endOfMonth, isSameMonth, startOfMonth } from "date-fns";

import { updatePassbookByTransaction } from "./transaction-handler";

import prisma from "@/db";
import { calculateMonthlySnapshotFromPassbooks } from "@/lib/calculators/dashboard-calculator";
import {
  calculateExpectedTotalLoanInterestAmountFromTransactions,
} from "@/lib/calculators/expected-interest";
import { calculateLoanDetails } from "@/lib/calculators/loan-calculator";
import { clearCache } from "@/lib/core/cache";
import { calculateInterestByAmount } from "@/lib/helper";
import {
  bulkPassbookUpdate,
  fetchAllPassbook,
  initializePassbookToUpdate,
} from "@/lib/helper";
import { vendorCalcHandler } from "@/logic/vendor-middleware";

export async function resetAllTransactionMiddlewareHandler(
  shouldUpdatePassbooks = true,
  shouldUpdateDashboard = true
) {
  clearCache();
  await prisma.summary.deleteMany();

  const [transactions, passbooks, activeMemberCount] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { occurredAt: "asc" } }),
    fetchAllPassbook(),
    prisma.account.count({ where: { type: "MEMBER", active: true } }),
  ]);

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

  transactions.forEach((tx) => {
    const monthKey = startOfMonth(tx.occurredAt).toISOString();
    if (!transactionsByMonth.has(monthKey)) {
      transactionsByMonth.set(monthKey, []);
    }
    transactionsByMonth.get(monthKey)!.push(tx);
  });

  // Validate: Ensure no transactions were lost during grouping
  const groupedTransactionCount = Array.from(transactionsByMonth.values()).reduce(
    (sum, monthTxs) => sum + monthTxs.length,
    0
  );

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
    const monthLabel = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    console.log(`   ${monthLabel}: ${monthTxs.length} transactions`);
  });
  console.log();

  // Sort months chronologically
  const sortedMonths = sortedMonthKeys;

  // Monthly snapshots to create
  const monthlySnapshots: any[] = [];

  // Track synthetic LOAN_INTEREST transactions created during recalculation
  const syntheticLoanInterestTransactions: Array<{
    id: string;
    fromId: string;
    toId: string;
    amount: number;
    type: "LOAN_INTEREST";
    occurredAt: Date;
    method: "ACCOUNT";
    createdAt: Date;
    updatedAt: Date;
    currency?: string;
    postedAt?: Date | null;
    referenceId?: string | null;
    description?: string | null;
    tags?: string[];
    createdById?: string | null;
    updatedById?: string | null;
  }> = [];

  // Process each month
  for (const monthKey of sortedMonths) {
    const monthTransactions = transactionsByMonth.get(monthKey)!;
    const monthStart = new Date(monthKey);
    const monthEnd = isSameMonth(monthStart, new Date()) ? new Date() : endOfMonth(monthStart); // if this month then new date else current month end

    // Process all transactions for this month
    for (const transaction of monthTransactions) {
      passbookToUpdate = updatePassbookByTransaction(
        passbookToUpdate,
        transaction
      );
    }

    // Calculate vendor profits after transactions
    const vendorIds = Array.from(passbookToUpdate.keys()).filter(
      (id) => passbookToUpdate.get(id)?.data.kind === "VENDOR"
    );
    passbookToUpdate = vendorCalcHandler(passbookToUpdate, vendorIds);

    // Calculate loan interest for this month
    const loanAccounts = Array.from(passbookToUpdate.keys()).filter((id) => {
      const pb = passbookToUpdate.get(id);
      return pb?.data.kind === "MEMBER";
    });

    for (const accountId of loanAccounts) {
      const passbook = passbookToUpdate.get(accountId);
      if (!passbook) continue;

      // loanHistory is stored as JSON, need to parse it
      const loanHistoryData = passbook.data.loanHistory as any;
      const loanTransactions = Array.isArray(loanHistoryData)
        ? loanHistoryData
        : [];

      const loanDetails = calculateLoanDetails(loanTransactions);
      if (
        loanDetails &&
        typeof loanDetails.totalLoanBalance === "number" &&
        loanDetails.totalLoanBalance > 0
      ) {
        const interestResult = calculateInterestByAmount(
          loanDetails.totalLoanBalance,
          monthStart,
          monthEnd
        );
        if (interestResult.interestAmount > 0) {
          const syntheticTransaction = {
            id: `loan-interest-${accountId}-${monthKey}`,
            fromId: accountId,
            toId: "CLUB",
            amount: interestResult.interestAmount,
            type: "LOAN_INTEREST",
            occurredAt: monthEnd,
            method: "ACCOUNT",
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;

          passbookToUpdate = updatePassbookByTransaction(passbookToUpdate, syntheticTransaction);

          // Track synthetic transaction for interest calculation
          syntheticLoanInterestTransactions.push(syntheticTransaction);
        }
      }
    }

    // Create monthly snapshot if needed
    if (shouldUpdateDashboard) {
      // Combine real transactions with synthetic LOAN_INTEREST transactions
      // for accurate interest calculation
      const syntheticForMonth = syntheticLoanInterestTransactions
        .filter(tx => tx.occurredAt <= monthEnd)
        .map(tx => ({
          id: tx.id,
          type: tx.type,
          fromId: tx.fromId,
          toId: tx.toId,
          amount: tx.amount,
          currency: "INR",
          method: tx.method,
          occurredAt: tx.occurredAt,
          postedAt: null,
          referenceId: null,
          description: null,
          tags: [],
          createdById: null,
          updatedById: null,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
        })) as typeof transactions;

      const allTransactionsIncludingSynthetic = [
        ...transactions,
        ...syntheticForMonth,
      ];

      // Calculate expected total loan interest amount from existing transactions
      // Filter transactions to only include those up to this month's end date
      // This avoids fetching from database multiple times
      const { expectedTotalLoanInterestAmount } =
        calculateExpectedTotalLoanInterestAmountFromTransactions(
          allTransactionsIncludingSynthetic,
          monthEnd
        );

      const snapshot = await calculateMonthlySnapshotFromPassbooks(
        monthStart,
        passbookToUpdate,
        activeMemberCount,
        expectedTotalLoanInterestAmount,
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
