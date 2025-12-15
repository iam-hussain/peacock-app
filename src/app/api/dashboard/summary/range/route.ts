export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { endOfMonth, parse, startOfMonth } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/db";
import { transformSummaryToDashboardData } from "@/lib/transformers/dashboard-summary";

/**
 * GET /api/dashboard/summary/range?from=YYYY-MM&to=YYYY-MM
 * Get dashboard summaries for a date range (for graphs/analytics)
 * Returns array of monthly snapshots - NO CALCULATIONS
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!fromParam || !toParam) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing from or to parameters. Use YYYY-MM format",
        },
        { status: 400 }
      );
    }

    // Parse date strings (YYYY-MM)
    const fromDate = parse(fromParam, "yyyy-MM", new Date());
    const toDate = parse(toParam, "yyyy-MM", new Date());

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    const fromMonthStart = startOfMonth(fromDate);
    const toMonthEnd = endOfMonth(toDate);

    // Fetch all summaries in range
    const summaries = await prisma.summary.findMany({
      where: {
        monthStartDate: {
          gte: fromMonthStart,
          lte: toMonthEnd,
        },
      },
      orderBy: { monthStartDate: "asc" },
    });

    if (summaries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No dashboard summaries found for this range. Please run recalculation first.",
        },
        { status: 404 }
      );
    }

    // Structure response - return array of monthly snapshots using common transformer
    const response = {
      success: true,
      from: fromParam,
      to: toParam,
      count: summaries.length,
      summaries: summaries.map((summary) => transformSummaryToDashboardData(summary)),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching dashboard summary range:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard summary range" },
      { status: 500 }
    );
  }
}
