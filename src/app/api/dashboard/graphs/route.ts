export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { parse, startOfMonth } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/db";

/**
 * @swagger
 * /api/dashboard/graphs:
 *   get:
 *     summary: Get dashboard summaries for date range
 *     description: Returns dashboard summaries for a date range, optimized for graph/chart visualization. Returns only fields required for charts with no calculations.
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *           example: "2024-01"
 *         description: Start month in YYYY-MM format
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *           example: "2024-12"
 *         description: End month in YYYY-MM format
 *     responses:
 *       200:
 *         description: List of dashboard summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 summaries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Summary'
 *       400:
 *         description: Invalid parameters
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
 *                   example: "Both from and to parameters are required (format: YYYY-MM)"
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

    const summaries = await prisma.summary.findMany({
      where: {
        monthStartDate: {
          gte: fromMonthStart,
          lte: toMonthStart,
        },
      },
      orderBy: { monthStartDate: "asc" },
      select: {
        monthStartDate: true,
        availableCash: true,
        totalInvested: true,
        pendingAmounts: true,
        currentValue: true,
        totalPortfolioValue: true,
        currentLoanTaken: true,
        interestBalance: true,
      },
    });

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
