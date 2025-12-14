export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { parse } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/db";

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

    // Structure response according to financial domain semantics
    const response = {
      success: true,
      data: {
        // Members
        members: {
          activeMembers: summary.activeMembers,
          clubAgeMonths: summary.clubAgeMonths,
        },
        // Member Funds
        memberFunds: {
          totalDeposits: summary.totalDeposits,
          memberBalance: summary.memberBalance,
        },
        // Member Outflow
        memberOutflow: {
          profitWithdrawals: summary.profitWithdrawals,
          memberAdjustments: summary.memberAdjustments,
        },
        // Loans - Lifetime
        loans: {
          lifetime: {
            totalLoanGiven: summary.totalLoanGiven,
            totalInterestCollected: summary.totalInterestCollected,
          },
          // Loans - Outstanding
          outstanding: {
            currentLoanTaken: summary.currentLoanTaken,
            interestBalance: summary.interestBalance,
          },
        },
        // Vendor
        vendor: {
          vendorInvestment: summary.vendorInvestment,
          vendorProfit: summary.vendorProfit,
        },
        // Cash Flow
        cashFlow: {
          totalInvested: summary.totalInvested,
          pendingAmounts: summary.pendingAmounts,
        },
        // Valuation
        valuation: {
          availableCash: summary.availableCash,
          currentValue: summary.currentValue,
        },
        // Portfolio
        portfolio: {
          totalPortfolioValue: summary.totalPortfolioValue,
        },
        // System Metadata
        systemMeta: {
          monthStartDate: summary.monthStartDate,
          monthEndDate: summary.monthEndDate,
          recalculatedAt: summary.recalculatedAt,
          recalculatedByAdminId: summary.recalculatedByAdminId,
          isLocked: summary.isLocked,
        },
      },
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
