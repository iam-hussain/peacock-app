export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";

/**
 * GET /api/dashboard/summary/latest
 * Get the latest dashboard summary
 */
export async function GET() {
  try {
    const summary = await (prisma as any).dashboardMonthlySummary?.findFirst({
      orderBy: { monthStartDate: "desc" },
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
        {
          success: false,
          error: "No dashboard summary found. Please run recalculation first.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error fetching latest dashboard summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch latest dashboard summary" },
      { status: 500 }
    );
  }
}
