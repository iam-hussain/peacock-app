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
import { newZoneDate } from "@/lib/date";
import { fetchAllPassbook, initializePassbookToUpdate } from "@/lib/helper";
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
  const [allTransactions, allPassbooks] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: { transactionAt: "asc" },
    }),
    fetchAllPassbook(),
  ]);

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

    // Calculate values for this month
    const available = clubData?.currentClubBalance || 0;
    const invested = (clubData?.totalLoanBalance || 0) + totalVendorHolding;
    const pending =
      (clubData?.totalInterestBalance || 0) +
      (clubData?.totalOffsetBalance || 0) +
      (clubData?.totalMemberPeriodicDepositsBalance || 0);

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
