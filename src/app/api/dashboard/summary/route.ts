export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { parse } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/db";
import { transformSummaryToDashboardData } from "@/lib/transformers/dashboard-summary";

/**
 * GET /api/dashboard/summary?month=YYYY-MM
 * Get dashboard summary for a specific month (or latest if no month provided)
 * Returns structured financial data from Summary table - NO CALCULATIONS
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get("month");

    let summary;

    if (monthParam) {
      // Parse month string (YYYY-MM) to Date
      const monthDate = parse(monthParam, "yyyy-MM", new Date());
      if (isNaN(monthDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid month format. Use YYYY-MM" },
          { status: 400 }
        );
      }

      summary = await prisma.summary.findFirst();

      if (!summary) {
        return NextResponse.json(
          { success: false, error: "Summary not found for this month" },
          { status: 404 }
        );
      }
    } else {
      // Return latest summary if no month provided
      summary = await prisma.summary.findFirst({
        orderBy: { monthStartDate: "desc" },
      });

      if (!summary) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No dashboard summary found. Please run recalculation first.",
          },
          { status: 404 }
        );
      }
    }

    // Calculate pending adjustments dynamically (not stored in Summary table)
    // Total expected = sum of all members' (joiningOffset + delayOffset)
    // Total received = summary.memberAdjustments
    const allMemberPassbooks = await prisma.passbook.findMany({
      where: { kind: "MEMBER" },
      select: { joiningOffset: true, delayOffset: true },
    });

    const totalExpectedAdjustments = allMemberPassbooks.reduce(
      (sum, pb) => sum + (pb.joiningOffset || 0) + (pb.delayOffset || 0),
      0
    );
    const totalReceivedAdjustments = summary.memberAdjustments || 0;
    const pendingAdjustments = Math.max(0, totalExpectedAdjustments - totalReceivedAdjustments);

    // Transform summary to dashboard data structure using common transformer
    const dashboardData = transformSummaryToDashboardData(summary);

    // Add pending adjustments to the transformed data
    dashboardData.memberOutflow.pendingAdjustments = pendingAdjustments;

    const response = {
      success: true,
      data: dashboardData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}
