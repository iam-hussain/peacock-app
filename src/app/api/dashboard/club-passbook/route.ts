export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { clubMonthsFromStart } from "@/lib/config/club";
import {
  calculateExpectedTotalLoanInterestAmountFromDb,
} from "@/lib/calculators/expected-interest";
import { transformClubPassbookToSummary } from "@/lib/transformers/dashboard-summary";
import {
  ClubFinancialSnapshot,
  VendorFinancialSnapshot,
} from "@/lib/validators/type";

/**
 * GET /api/dashboard/club-passbook
 * Get dashboard data from CLUB passbook - transforms ClubFinancialSnapshot to match summary structure
 * Returns structured financial data from Club passbook payload
 */
export async function GET() {
  try {
    // Fetch club passbook
    const clubPassbook = await prisma.passbook.findFirst({
      where: { kind: "CLUB" },
      select: { payload: true, updatedAt: true },
    });

    if (!clubPassbook) {
      return NextResponse.json(
        {
          success: false,
          error:
            "CLUB passbook not found. Please run seed to initialize database.",
        },
        { status: 404 }
      );
    }

    const clubData = clubPassbook.payload as ClubFinancialSnapshot;

    // Fetch active members count and calculate club age
    const members = await prisma.account.findMany({
      where: { type: "MEMBER" },
      select: { status: true, createdAt: true },
    });

    const activeMembers = members.filter((m) => m.status === "ACTIVE").length;

    // Calculate club age in months
    const clubAgeMonths = clubMonthsFromStart();

    // Calculate expected total loan interest amount dynamically from transactions
    const { expectedTotalLoanInterestAmount } =
      await calculateExpectedTotalLoanInterestAmountFromDb();

    // Fetch vendor passbooks to calculate total vendor profit
    const vendorPassbooks = await prisma.passbook.findMany({
      where: { kind: "VENDOR" },
      select: { payload: true },
    });

    // Calculate pending adjustments: Total expected (sum of all members' offsets) - Total received
    const allMemberPassbooks = await prisma.passbook.findMany({
      where: { kind: "MEMBER" },
      select: { joiningOffset: true, delayOffset: true },
    });

    const totalExpectedAdjustments = allMemberPassbooks.reduce(
      (sum, pb) => sum + (pb.joiningOffset || 0) + (pb.delayOffset || 0),
      0
    );
    const totalReceivedAdjustments = clubData.memberOffsetDepositsTotal || 0;
    const pendingAdjustments = Math.max(0, totalExpectedAdjustments - totalReceivedAdjustments);

    // Transform club passbook to summary structure using common transformer
    const summaryData = transformClubPassbookToSummary({
      clubData,
      activeMembers,
      clubAgeMonths,
      expectedTotalLoanInterestAmount,
      vendorPassbooks: vendorPassbooks.map((vp) => ({
        payload: vp.payload as VendorFinancialSnapshot,
      })),
      monthStartDate: null, // Not applicable for passbook
      monthEndDate: null, // Not applicable for passbook
      recalculatedAt: clubPassbook.updatedAt,
      recalculatedByAdminId: null, // Not tracked in passbook
      isLocked: false, // Not applicable for passbook
      pendingAdjustments,
    });

    // Structure response according to financial domain semantics (matching summary structure)
    const response = {
      success: true,
      data: summaryData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching club passbook:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch club passbook" },
      { status: 500 }
    );
  }
}
