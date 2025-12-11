export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { NextResponse } from "next/server";

import prisma from "@/db";
import cache from "@/lib/cache";
import { clubConfig } from "@/lib/config";
import { calculateMonthsDifference, newZoneDate } from "@/lib/date";
import {
  calculateInterestByAmount,
  fetchAllPassbook,
  initializePassbookToUpdate,
} from "@/lib/helper";
import { updatePassbookByTransaction } from "@/logic/transaction-handler";
import { calculateVendorProfits } from "@/logic/vendor-middleware";

interface MonthlyData {
  month: string;
  monthYear: string;
  available: number;
  invested: number;
  pending: number;
}

/**
 * Calculates expected member deposits up to a specific date
 */
function getExpectedMemberDepositsUpToDate(
  membersCount: number,
  targetDate: Date
): number {
  const perMember = getMemberTotalDepositUpToDate(targetDate);
  return perMember * membersCount;
}

/**
 * Calculates expected member deposit per member up to a specific date
 */
function getMemberTotalDepositUpToDate(targetDate: Date): number {
  const values = clubConfig.stages.map((stage) => {
    const stageEndDate = stage.endDate || newZoneDate();
    const effectiveEndDate =
      targetDate < stageEndDate ? targetDate : stageEndDate;
    const effectiveStartDate =
      targetDate < stage.startDate ? targetDate : stage.startDate;

    if (effectiveEndDate < stage.startDate) {
      return 0;
    }

    const diff = calculateMonthsDifference(
      effectiveEndDate,
      effectiveStartDate
    );
    return diff * stage.amount;
  });

  return values.reduce((a, b) => a + Math.abs(b), 0);
}

/**
 * Calculates expected loan interest up to a specific date
 */
async function getExpectedLoanInterestUpToDate(
  targetDate: Date,
  allLoanTransactions: Array<{
    transactionAt: Date;
    transactionType: string;
    amount: number;
    fromId: string;
    toId: string;
  }>
): Promise<number> {
  // Filter loan transactions up to target date
  const transactionsUpToDate = allLoanTransactions.filter(
    (tx) => newZoneDate(tx.transactionAt) <= targetDate
  );

  // Group transactions by member
  const memberLoanTransactions = new Map<
    string,
    Array<{
      transactionAt: Date;
      transactionType: string;
      amount: number;
    }>
  >();

  for (const tx of transactionsUpToDate) {
    const memberId = tx.transactionType === "LOAN_TAKEN" ? tx.toId : tx.fromId;
    if (!memberLoanTransactions.has(memberId)) {
      memberLoanTransactions.set(memberId, []);
    }
    memberLoanTransactions.get(memberId)!.push({
      transactionAt: tx.transactionAt,
      transactionType: tx.transactionType,
      amount: tx.amount,
    });
  }

  // Calculate loan history for each member
  const allLoanHistories: Array<{
    amount: number;
    startDate: number;
    endDate?: number;
  }> = [];

  for (const [, transactions] of Array.from(memberLoanTransactions.entries())) {
    // Sort transactions by date
    transactions.sort(
      (a: { transactionAt: Date }, b: { transactionAt: Date }) =>
        newZoneDate(a.transactionAt).getTime() -
        newZoneDate(b.transactionAt).getTime()
    );

    let accountBalance = 0;
    let currentLoan: { amount: number; startDate: Date } | null = null;

    for (const transaction of transactions) {
      const { transactionAt, transactionType, amount } = transaction;

      if (transactionType === "LOAN_TAKEN") {
        if (currentLoan) {
          allLoanHistories.push({
            amount: currentLoan.amount,
            startDate: currentLoan.startDate.getTime(),
            endDate: newZoneDate(transactionAt).getTime(),
          });
        }
        accountBalance += amount;
        currentLoan = {
          amount: accountBalance,
          startDate: newZoneDate(transactionAt),
        };
      } else if (transactionType === "LOAN_REPAY") {
        if (currentLoan) {
          allLoanHistories.push({
            amount: accountBalance,
            startDate: currentLoan.startDate.getTime(),
            endDate: newZoneDate(transactionAt).getTime(),
          });
          currentLoan = null;
        }
        accountBalance -= amount;
        if (accountBalance > 0) {
          currentLoan = {
            amount: accountBalance,
            startDate: newZoneDate(transactionAt),
          };
        }
      }
    }

    // Add active loan if balance remains
    if (accountBalance > 0 && currentLoan) {
      allLoanHistories.push({
        amount: accountBalance,
        startDate: currentLoan.startDate.getTime(),
      });
    }
  }

  // Calculate total expected interest up to target date
  const expectedInterest = allLoanHistories
    .map((loan) => {
      const loanEndDate = loan.endDate
        ? loan.endDate < targetDate.getTime()
          ? loan.endDate
          : targetDate.getTime()
        : targetDate.getTime();
      const { interestAmount } = calculateInterestByAmount(
        loan.amount,
        loan.startDate,
        loanEndDate
      );
      return interestAmount;
    })
    .reduce((a, b) => a + b, 0);

  return expectedInterest;
}

/**
 * Calculates monthly statistics by processing transactions up to each month end
 */
async function calculateMonthlyData(
  startDate: Date,
  endDate: Date
): Promise<MonthlyData[]> {
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  const monthlyData: MonthlyData[] = [];

  // Fetch all transactions from the beginning (needed for accurate monthly calculations)
  // and passbooks once
  const [allTransactions, allPassbooks, allMembers] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: { transactionAt: "asc" },
    }),
    fetchAllPassbook(),
    prisma.account.findMany({
      where: { isMember: true },
      select: { id: true },
    }),
  ]);

  const membersCount = allMembers.length;

  // Filter loan transactions once for efficiency
  const allLoanTransactions = allTransactions
    .filter(
      (tx) =>
        tx.transactionType === "LOAN_TAKEN" ||
        tx.transactionType === "LOAN_REPAY"
    )
    .map((tx) => ({
      transactionAt: tx.transactionAt,
      transactionType: tx.transactionType,
      amount: tx.amount,
      fromId: tx.fromId,
      toId: tx.toId,
    }));

  // Process each month
  for (const monthStart of months) {
    const monthEnd = endOfMonth(monthStart);
    const monthKey = format(monthStart, "MMM yyyy");

    // Filter transactions up to this month end (from the beginning of time)
    const transactionsUpToMonth = allTransactions.filter(
      (tx) => newZoneDate(tx.transactionAt) <= monthEnd
    );

    // Initialize passbooks for this month calculation
    const passbookToUpdate = initializePassbookToUpdate(allPassbooks, true);

    // Process all transactions up to this month
    let updatedPassbooks = passbookToUpdate;
    for (const transaction of transactionsUpToMonth) {
      updatedPassbooks = updatePassbookByTransaction(
        updatedPassbooks,
        transaction
      );
    }

    // Calculate vendor profits for this month
    const vendorPassbooks = allPassbooks.filter((pb) => pb.type === "VENDOR");
    const vendorIds = vendorPassbooks.map((pb) => pb.id);
    const finalPassbooks = calculateVendorProfits(updatedPassbooks, vendorIds);

    // Extract club passbook data
    const clubPassbook = finalPassbooks.get("CLUB");
    const clubData = clubPassbook?.data?.payload as any;

    // Calculate vendor holding (investment - returns)
    const totalInvestment = clubData?.totalInvestment || 0;
    const totalReturns = clubData?.totalReturns || 0;
    const totalVendorHolding = totalInvestment - totalReturns;

    // Calculate expected amounts up to this month end
    const expectedMemberDeposits = getExpectedMemberDepositsUpToDate(
      membersCount,
      monthEnd
    );
    const expectedLoanInterest = await getExpectedLoanInterestUpToDate(
      monthEnd,
      allLoanTransactions
    );

    // Calculate actual amounts collected up to this month end
    const actualMemberDeposits = clubData?.totalMemberPeriodicDeposits || 0;
    const actualLoanInterest = clubData?.totalInterestPaid || 0;

    // Calculate pending amount: Only interest balance is pending
    // (Expected deposits - Actual deposits) + (Expected interest - Actual interest)
    // Note: Loan taken amounts are invested, not pending
    const pendingMemberDeposits = Math.max(
      0,
      expectedMemberDeposits - actualMemberDeposits
    );
    const pendingLoanInterest = Math.max(
      0,
      expectedLoanInterest - actualLoanInterest
    );
    const pending = pendingMemberDeposits + pendingLoanInterest;

    // Calculate values for this month
    const available = clubData?.currentClubBalance || 0;
    const invested = (clubData?.totalLoanBalance || 0) + totalVendorHolding;

    monthlyData.push({
      month: format(monthStart, "MMM"),
      monthYear: monthKey,
      available: Math.round(available),
      invested: Math.round(invested),
      pending: Math.round(pending),
    });
  }

  return monthlyData;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const range = searchParams.get("range") || "all-time";

    // Generate cache key based on range
    const cacheKey = `chart-monthly-data-${range}-${startDateParam || ""}-${endDateParam || ""}`;

    // Check cache first (24 hour TTL)
    const cachedData = cache.get<MonthlyData[]>(cacheKey);
    if (cachedData) {
      return NextResponse.json({ data: cachedData, cached: true });
    }

    // Determine date range
    const clubStartDate = clubConfig.startedAt;
    const currentDate = newZoneDate();

    let startDate: Date;
    let endDate: Date = currentDate;

    if (startDateParam && endDateParam) {
      startDate = newZoneDate(startDateParam);
      endDate = newZoneDate(endDateParam);
    } else if (range === "all-time") {
      startDate = clubStartDate;
    } else if (range.startsWith("year-")) {
      const yearIndex = parseInt(range.split("-")[1]) - 1;
      const yearStart = new Date(clubStartDate);
      yearStart.setFullYear(yearStart.getFullYear() + yearIndex);
      startDate = startOfMonth(yearStart);
      endDate = endOfMonth(
        new Date(yearStart.getFullYear() + 1, yearStart.getMonth(), 0)
      );
      if (endDate > currentDate) {
        endDate = currentDate;
      }
    } else {
      // Last N months
      const months = parseInt(range);
      startDate = new Date(currentDate);
      startDate.setMonth(startDate.getMonth() - months);
      startDate = startOfMonth(startDate);
    }

    // Calculate monthly data
    const monthlyData = await calculateMonthlyData(startDate, endDate);

    // Cache for 24 hours (86400 seconds)
    cache.set(cacheKey, monthlyData, 86400);

    return NextResponse.json({ data: monthlyData, cached: false });
  } catch (error) {
    console.error("Error calculating monthly chart data:", error);
    return NextResponse.json(
      { error: "Failed to calculate monthly data" },
      { status: 500 }
    );
  }
}
