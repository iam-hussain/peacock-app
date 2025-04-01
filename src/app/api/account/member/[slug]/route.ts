export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { getMemberTotalDepositUpToday } from "@/lib/club";
import { memberMonthsPassedString } from "@/lib/date";
import { ClubPassbookData, VendorPassbookData } from "@/lib/type";
import {
  membersTableTransform,
  TransformedLoan,
  TransformedMember,
  transformLoanForTable,
} from "@/transformers/account";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const account = await prisma.account.findUniqueOrThrow({
      where: { slug, isMember: true },
      include: {
        passbook: true,
      },
    });

    const [club, membersCount, offsetData, vendorsPass] = await Promise.all([
      prisma.passbook.findFirstOrThrow({
        where: {
          type: "CLUB",
        },
        select: {
          payload: true,
        },
      }),
      prisma.account.count({
        where: {
          isMember: true,
          active: true,
        },
      }),
      prisma.passbook.aggregate({
        where: {
          type: "MEMBER",
        },
        _sum: {
          delayOffset: true,
          joiningOffset: true,
        },
      }),
      prisma.passbook.findMany({
        where: {
          type: "VENDOR",
        },
        select: {
          payload: true,
        },
      }),
    ]);

    const totalVendorProfit = vendorsPass
      .map((e) => {
        const { totalInvestment = 0, totalReturns = 0 } =
          e.payload as VendorPassbookData;
        return Math.max(totalReturns - totalInvestment, 0);
      })
      .reduce((a, b) => a + b, 0);

    const totalOffsetAmount =
      (offsetData._sum.delayOffset || 0) + (offsetData._sum.joiningOffset || 0);
    const clubData = club.payload as ClubPassbookData;
    const totalProfitCollected =
      totalOffsetAmount + clubData.totalInterestPaid + totalVendorProfit;

    const availableProfitAmount =
      totalProfitCollected - clubData.totalMemberProfitWithdrawals;

    const totalReturnAmount = availableProfitAmount / membersCount;

    const memberTotalDeposit = getMemberTotalDepositUpToday();
    const memberLoan = transformLoanForTable(account);
    const memberData = membersTableTransform(
      account,
      memberTotalDeposit,
      totalReturnAmount
    );

    return NextResponse.json({
      member: {
        ...memberLoan,
        ...memberData,
        ...memberMonthsPassedString(account.startAt),
      },
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { message: "Failed to delete transaction." },
      { status: 500 }
    );
  }
}

export type GetMemberBySlugResponse = {
  member: TransformedMember &
    TransformedLoan &
    ReturnType<typeof memberMonthsPassedString>;
};
