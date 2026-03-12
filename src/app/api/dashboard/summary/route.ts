export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { parse } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/db";
import { calculateExpectedTotalLoanInterestAmountFromDb } from "@/lib/calculators/expected-interest";
import { clubMonthsFromStart } from "@/lib/config/club";
import {
  transformClubPassbookToSummary,
  transformSummaryToDashboardData,
} from "@/lib/transformers/dashboard-summary";
import {
  ClubFinancialSnapshot,
  VendorFinancialSnapshot,
} from "@/lib/validators/type";

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary
 *     description: Returns structured financial data from Summary table for a specific month or the latest summary if no month provided. No calculations performed - data comes directly from database.
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *           example: "2024-01"
 *         description: Month in YYYY-MM format. If not provided, returns latest summary.
 *     responses:
 *       200:
 *         description: Dashboard summary data
 *         headers:
 *           ETag:
 *             description: ETag for cache validation
 *             schema:
 *               type: string
 *           Cache-Control:
 *             description: Cache control directives
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Dashboard financial data structure
 *                   properties:
 *                     availableCash:
 *                       type: number
 *                       description: Available cash balance
 *                     totalInvested:
 *                       type: number
 *                       description: Total invested amount
 *                     currentValue:
 *                       type: number
 *                       description: Current portfolio value
 *                     totalPortfolioValue:
 *                       type: number
 *                       description: Total portfolio value
 *                     currentLoanTaken:
 *                       type: number
 *                       description: Current loan amount
 *                     interestBalance:
 *                       type: number
 *                       description: Interest balance
 *                     memberOutflow:
 *                       type: object
 *                       properties:
 *                         pendingAdjustments:
 *                           type: number
 *                           description: Pending member adjustments
 *       304:
 *         description: Not Modified - client has cached version
 *       400:
 *         description: Invalid month format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid month format. Use YYYY-MM
 *       404:
 *         description: Summary not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
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
      // No month param — compute live data from club passbook (same as club-passbook route)
      // This ensures Summary and Club Passbook views always show identical current data
      const [clubPassbook, activeMembers, vendorPassbooks, allMemberPassbooks] =
        await Promise.all([
          prisma.passbook.findFirst({
            where: { kind: "CLUB" },
            select: { payload: true, updatedAt: true },
          }),
          prisma.account.count({
            where: { type: "MEMBER", status: "ACTIVE" },
          }),
          prisma.passbook.findMany({
            where: { kind: "VENDOR" },
            select: { payload: true },
          }),
          prisma.passbook.findMany({
            where: { kind: "MEMBER" },
            select: { joiningOffset: true, delayOffset: true },
          }),
        ]);

      if (!clubPassbook) {
        return NextResponse.json(
          {
            success: false,
            error:
              "No dashboard data found. Please run recalculation first.",
          },
          { status: 404 }
        );
      }

      const clubData = clubPassbook.payload as ClubFinancialSnapshot;
      const clubAgeMonths = clubMonthsFromStart();

      const { expectedTotalLoanInterestAmount } =
        await calculateExpectedTotalLoanInterestAmountFromDb();

      const totalExpectedAdjustments = allMemberPassbooks.reduce(
        (sum, pb) => sum + (pb.joiningOffset || 0) + (pb.delayOffset || 0),
        0
      );
      const totalReceivedAdjustments = clubData.memberOffsetDepositsTotal || 0;
      const pendingAdjustments = Math.max(
        0,
        totalExpectedAdjustments - totalReceivedAdjustments
      );

      const dashboardData = transformClubPassbookToSummary({
        clubData,
        activeMembers,
        clubAgeMonths,
        expectedTotalLoanInterestAmount,
        vendorPassbooks: vendorPassbooks.map((vp) => ({
          payload: vp.payload as VendorFinancialSnapshot,
        })),
        monthStartDate: null,
        monthEndDate: null,
        recalculatedAt: clubPassbook.updatedAt,
        recalculatedByAdminId: null,
        isLocked: false,
        pendingAdjustments,
      });

      const response = { success: true, data: dashboardData };

      const etag = `"${clubPassbook.updatedAt.getTime()}"`;
      const ifNoneMatch = request.headers.get("if-none-match");
      if (ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304 });
      }

      return NextResponse.json(response, {
        headers: {
          "Cache-Control": "private, no-cache, must-revalidate",
          ETag: etag,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Historical month query — use stored Summary snapshot
    const allMemberPassbooks = await prisma.passbook.findMany({
      where: { kind: "MEMBER" },
      select: { joiningOffset: true, delayOffset: true },
    });

    const totalExpectedAdjustments = allMemberPassbooks.reduce(
      (sum, pb) => sum + (pb.joiningOffset || 0) + (pb.delayOffset || 0),
      0
    );
    const totalReceivedAdjustments = summary.memberAdjustments || 0;
    const pendingAdjustments = Math.max(
      0,
      totalExpectedAdjustments - totalReceivedAdjustments
    );

    const dashboardData = transformSummaryToDashboardData(summary);
    dashboardData.memberOutflow.pendingAdjustments = pendingAdjustments;

    const response = {
      success: true,
      data: dashboardData,
    };

    const etag = `"${summary.recalculatedAt.getTime()}"`;
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, no-cache, must-revalidate",
        ETag: etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}
