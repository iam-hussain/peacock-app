export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { parse, startOfMonth } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/db";

/**
 * GET /api/dashboard/summary?month=YYYY-MM
 * Get dashboard summary for a specific month
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get("month");

    if (!monthParam) {
      return NextResponse.json(
        {
          success: false,
          error: "Month parameter is required (format: YYYY-MM)",
        },
        { status: 400 }
      );
    }

    // Parse month string (YYYY-MM) to Date
    const monthDate = parse(monthParam, "yyyy-MM", new Date());
    if (isNaN(monthDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid month format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    const monthStart = startOfMonth(monthDate);

    const summary = await (prisma as any).dashboardMonthlySummary?.findUnique({
      where: { monthStartDate: monthStart },
    });

    if (!summary) {
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
      return NextResponse.json(
        { success: false, error: "Summary not found for this month" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}
