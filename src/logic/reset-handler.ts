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
import { recomputeClubDashboardAggregates } from "@/lib/calculators/club-aggregates";
import { calculateMonthlySnapshotFromPassbooks } from "@/lib/calculators/dashboard-calculator";
import { calculateExpectedTotalLoanInterestAmountFromTransactions } from "@/lib/calculators/expected-interest";
import { clubConfig } from "@/lib/config/config";
import { clearCache } from "@/lib/core/cache";
import {
  bulkPassbookUpdate,
  fetchAllPassbook,
  getDefaultPassbookData,
  initializePassbookToUpdate,
} from "@/lib/helper";
import {
  ClubFinancialSnapshot,
  MemberFinancialSnapshot,
} from "@/lib/validators/type";

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

  // Map accountId → {joiningOffset, delayOffset} for active members so the
  // monthly snapshot can compute per-active-member deposit + pending sums.
  const activeMemberOffsets = new Map<
    string,
    { joiningOffset: number; delayOffset: number }
  >();
  for (const passbook of activeMemberPassbooks) {
    if (passbook.account?.id) {
      activeMemberOffsets.set(passbook.account.id, {
        joiningOffset: Number(passbook.joiningOffset) || 0,
        delayOffset: Number(passbook.delayOffset) || 0,
      });
    }
  }

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
        totalActiveMemberAdjustments,
        activeMemberOffsets
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
    // Refresh the derived CLUB-passbook aggregates (active-only totals,
    // expected interest) after the bulk update so the dashboard reads them
    // directly instead of re-aggregating at request time.
    try {
      await recomputeClubDashboardAggregates();
    } catch (aggregateError) {
      console.error(
        "⚠️  Failed to recompute club dashboard aggregates after reset",
        aggregateError
      );
    }
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

/**
 * Recalculate a single member's passbook and adjust the CLUB passbook accordingly.
 *
 * Instead of rebuilding ALL passbooks from ALL transactions, this function:
 * 1. Subtracts the member's current contribution from the CLUB passbook
 * 2. Resets the member's passbook to zero
 * 3. Replays only the member's transactions to rebuild their passbook and re-add to CLUB
 *
 * For V1, vendor passbooks are not adjusted — only the member + club passbooks are recalculated.
 */
export async function recalculateSingleMemberPassbook(
  memberId: string
): Promise<void> {
  clearCache();

  // 1. Fetch the member's passbook and the CLUB passbook
  const passbooks = await prisma.passbook.findMany({
    where: {
      OR: [{ account: { id: memberId } }, { kind: "CLUB" }],
    },
    select: {
      id: true,
      kind: true,
      payload: true,
      account: { select: { id: true } },
    },
  });

  const memberPassbook = passbooks.find(
    (p) => p.account?.id === memberId && p.kind === "MEMBER"
  );
  const clubPassbook = passbooks.find((p) => p.kind === "CLUB");

  if (!memberPassbook) {
    throw new Error(`Passbook not found for member: ${memberId}`);
  }
  if (!clubPassbook) {
    throw new Error("CLUB passbook not found");
  }

  // 2. Fetch ALL transactions where this member is involved (fromId or toId)
  const memberTransactions = await prisma.transaction.findMany({
    where: {
      OR: [{ fromId: memberId }, { toId: memberId }],
    },
    orderBy: { occurredAt: "asc" },
  });

  // 3. Read current member passbook values
  const memberData = (memberPassbook.payload || {}) as MemberFinancialSnapshot;
  const clubData = (clubPassbook.payload || {}) as ClubFinancialSnapshot;

  // 4. Subtract the member's current contribution from the CLUB passbook ("undo" their impact)
  //    Calculate net cash effect of this member on the club
  const memberNetCash =
    (memberData.periodicDepositsTotal || 0) +
    (memberData.offsetDepositsTotal || 0) +
    (memberData.loansPrincipalRepaid || 0) +
    (memberData.interestPaidTotal || 0) -
    (memberData.withdrawalsTotal || 0) -
    (memberData.loansPrincipalTaken || 0);

  const adjustedClubData: ClubFinancialSnapshot = {
    ...clubData,
    memberPeriodicDepositsTotal:
      (clubData.memberPeriodicDepositsTotal || 0) -
      (memberData.periodicDepositsTotal || 0),
    memberOffsetDepositsTotal:
      (clubData.memberOffsetDepositsTotal || 0) -
      (memberData.offsetDepositsTotal || 0),
    memberWithdrawalsTotal:
      (clubData.memberWithdrawalsTotal || 0) -
      (memberData.withdrawalsTotal || 0),
    memberProfitWithdrawalsTotal:
      (clubData.memberProfitWithdrawalsTotal || 0) -
      (memberData.profitWithdrawalsTotal || 0),
    loansPrincipalDisbursed:
      (clubData.loansPrincipalDisbursed || 0) -
      (memberData.loansPrincipalTaken || 0),
    loansPrincipalRepaid:
      (clubData.loansPrincipalRepaid || 0) -
      (memberData.loansPrincipalRepaid || 0),
    loansOutstanding:
      (clubData.loansOutstanding || 0) - (memberData.loansOutstanding || 0),
    interestCollectedTotal:
      (clubData.interestCollectedTotal || 0) -
      (memberData.interestPaidTotal || 0),
    availableCashBalance: (clubData.availableCashBalance || 0) - memberNetCash,
    netClubValue:
      (clubData.netClubValue || 0) -
      ((memberData.periodicDepositsTotal || 0) +
        (memberData.offsetDepositsTotal || 0) -
        (memberData.withdrawalsTotal || 0)),
  };

  // 5. Reset the member's passbook to default (zero) values
  const defaultMemberData = getDefaultPassbookData(
    "MEMBER"
  ) as MemberFinancialSnapshot;

  // 6. Initialize the passbook update map with zeroed member and adjusted club
  type LedgerUpdateMap = Map<
    string,
    Parameters<typeof prisma.passbook.update>[0]
  >;

  let passbookToUpdate: LedgerUpdateMap = new Map();

  passbookToUpdate.set(memberId, {
    where: { id: memberPassbook.id },
    data: {
      kind: "MEMBER",
      payload: defaultMemberData,
      loanHistory: [],
    },
  });

  passbookToUpdate.set("CLUB", {
    where: { id: clubPassbook.id },
    data: {
      kind: "CLUB",
      payload: adjustedClubData,
      loanHistory: [],
    },
  });

  // 7. If there are no transactions, just write the zeroed/adjusted passbooks
  if (memberTransactions.length === 0) {
    await bulkPassbookUpdate(passbookToUpdate);
    clearCache();
    return;
  }

  // 8. For transactions involving other accounts (e.g., FUNDS_TRANSFER from/to another member,
  //    or VENDOR_INVEST/VENDOR_RETURNS with a vendor), we need those passbooks in the map too
  //    so that updatePassbookByTransaction can update both sides.
  //    Collect all unique counterpart account IDs from the member's transactions.
  const counterpartAccountIds = new Set<string>();
  for (const tx of memberTransactions) {
    if (tx.fromId !== memberId) {
      counterpartAccountIds.add(tx.fromId);
    }
    if (tx.toId !== memberId) {
      counterpartAccountIds.add(tx.toId);
    }
  }

  // Fetch counterpart passbooks (these are NOT reset — loaded with current values)
  if (counterpartAccountIds.size > 0) {
    const counterpartPassbooks = await prisma.passbook.findMany({
      where: {
        account: { id: { in: Array.from(counterpartAccountIds) } },
      },
      select: {
        id: true,
        kind: true,
        payload: true,
        account: { select: { id: true } },
      },
    });

    for (const pb of counterpartPassbooks) {
      if (pb.account?.id && !passbookToUpdate.has(pb.account.id)) {
        // Initialize with current values (isClean = false) — we don't reset counterpart passbooks
        passbookToUpdate.set(pb.account.id, {
          where: { id: pb.id },
          data: {
            kind: pb.kind,
            payload: pb.payload as any,
          },
        });
      }
    }
  }

  // 9. Replay all member transactions in occurredAt order
  for (const transaction of memberTransactions) {
    passbookToUpdate = updatePassbookByTransaction(
      passbookToUpdate,
      transaction
    );
  }

  // 10. Write updated passbooks
  await bulkPassbookUpdate(passbookToUpdate);

  clearCache();
}
