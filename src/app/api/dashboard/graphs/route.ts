export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { parse, startOfMonth } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/db";

/**
 * GET /api/dashboard/graphs?from=YYYY-MM&to=YYYY-MM
 * Get dashboard summaries for a date range (for graphs)
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
          error: "Both from and to parameters are required (format: YYYY-MM)",
        },
        { status: 400 }
      );
    }

    // Parse date strings
    const fromDate = parse(fromParam, "yyyy-MM", new Date());
    const toDate = parse(toParam, "yyyy-MM", new Date());

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    const fromMonthStart = startOfMonth(fromDate);
    const toMonthStart = startOfMonth(toDate);

    if (fromMonthStart > toMonthStart) {
      return NextResponse.json(
        {
          success: false,
          error: "From date must be before or equal to to date",
        },
        { status: 400 }
      );
    }

    const summaries =
      (await (prisma as any).dashboardMonthlySummary?.findMany({
        where: {
          monthStartDate: {
            gte: fromMonthStart,
            lte: toMonthStart,
          },
        },
        orderBy: { monthStartDate: "asc" },
      })) || [];

    // Check if model exists
    if (!(prisma as any).dashboardMonthlySummary) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Dashboard model not available. Please run: npx prisma generate && npx prisma migrate dev",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      summaries,
    });
  } catch (error) {
    console.error("Error fetching dashboard graphs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard graphs" },
      { status: 500 }
    );
  }
}
