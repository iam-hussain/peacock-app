import { $Enums, Account } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { clubMonthsFromStart, getClubTotalDepositUpToday } from "@/lib/club";
import { calculateInterestByAmount } from "@/lib/helper";
import {
  ClubPassbookData,
  LoanHistoryEntry,
  MemberPassbookData,
  VendorPassbookData,
} from "@/lib/type";

type StatClubPassbook = {
  payload: MemberPassbookData | ClubPassbookData;
  type: $Enums.PASSBOOK_TYPE;
  loanHistory: LoanHistoryEntry[];
};
type StatMemberPassbook = {
  payload: MemberPassbookData | ClubPassbookData;
  type: $Enums.PASSBOOK_TYPE;
  loanHistory: LoanHistoryEntry[];
  joiningOffset: number;
  delayOffset: number;
};

export async function GET() {
  try {
    const [passbooks, members, vendorsPass] = await Promise.all([
      prisma.passbook.findMany({
        where: {
          type: { in: ["CLUB", "MEMBER"] },
        },
        select: {
          type: true,
          loanHistory: true,
          payload: true,
          joiningOffset: true,
          delayOffset: true,
        },
      }),
      prisma.account.findMany({
        where: {
          isMember: true,
          active: true,
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
    const clubPassbook = passbooks.find((e) => e.type === "CLUB");
    const membersPassbooks = passbooks.filter((e) => e.type === "MEMBER");

    if (!clubPassbook) {
      throw new Error("Invalid club statistics");
    }

    return NextResponse.json({
      success: true,
      statistics: statisticsTransform(
        clubPassbook as any,
        membersPassbooks as any[],
        members.length,
        totalVendorProfit
      ),
      members: members
        .map(membersStatTransform)
        .sort((a, b) => (a.name > b.name ? 1 : -1)),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error || "An unexpected error occurred",
    });
  }
}

function statisticsTransform(
  clubPassbook: StatClubPassbook,
  membersPassbooks: StatMemberPassbook[],
  membersCount: number,
  totalVendorProfit: number
) {
  const expectedTotalLoanInterestAmount = membersPassbooks
    .map(({ loanHistory }) => loanHistory)
    .flat()
    .map((loan) => {
      const { interestAmount } = calculateInterestByAmount(
        loan.amount,
        loan.startDate,
        loan?.endDate
      );
      return interestAmount;
    })
    .reduce((a, b) => a + b, 0);
  const expectedTotalMemberPeriodicDeposits =
    getClubTotalDepositUpToday(membersCount);

  const {
    totalMemberPeriodicDeposits,
    totalMemberOffsetDeposits,
    totalMemberWithdrawals,
    totalMemberProfitWithdrawals,
    currentClubBalance,
    netClubBalance,
    totalInvestment,
    totalReturns,
    totalProfit,
    totalLoanTaken,
    totalLoanRepay,
    totalLoanBalance,
    totalInterestPaid,
  } = clubPassbook.payload as ClubPassbookData;

  const totalOffsetAmount = membersPassbooks
    .map((e) => e.joiningOffset + e.delayOffset)
    .reduce((a, b) => a + b, 0);

  const actualMemberPeriodicDeposits =
    totalMemberPeriodicDeposits - totalMemberWithdrawals;

  const actualMemberMemberWithdrawals =
    totalMemberProfitWithdrawals + totalMemberWithdrawals;

  const totalVendorHolding = totalInvestment - totalReturns;

  const currentClubNetValue =
    totalMemberPeriodicDeposits +
    totalMemberOffsetDeposits +
    totalInterestPaid +
    totalVendorProfit -
    actualMemberMemberWithdrawals;

  const expectedClubNetValue =
    expectedTotalMemberPeriodicDeposits +
    totalOffsetAmount +
    expectedTotalLoanInterestAmount +
    totalVendorProfit;

  return {
    membersCount,
    clubMonthsPassed: clubMonthsFromStart(),
    totalMemberWithdrawals,
    totalMemberPeriodicDeposits: actualMemberPeriodicDeposits,
    expectedTotalMemberPeriodicDeposits,
    totalMemberPeriodicDepositsBalance:
      expectedTotalMemberPeriodicDeposits -
      (totalMemberPeriodicDeposits - totalMemberWithdrawals),
    expectedTotalLoanInterestAmount,
    currentClubBalance,
    netClubBalance,
    totalInvestment,
    totalReturns,
    totalProfit,
    totalLoanTaken,
    totalLoanRepay,
    totalLoanBalance,
    totalInterestPaid,
    totalInterestBalance: expectedTotalLoanInterestAmount - totalInterestPaid,
    totalVendorProfit,
    totalOffsetPaid: totalMemberOffsetDeposits,
    totalOffsetBalance: totalOffsetAmount - totalMemberOffsetDeposits,
    currentClubNetValue,
    totalVendorHolding,
    expectedClubNetValue,
    totalMemberProfitWithdrawals,
    totalOffsetAmount,
    // deposit: currentIn - statistics.offsetIn,
    // balance: totalDeposit - currentIn + offsetBalance,
    // offset: statistics.offset,
    // offsetIn: statistics.offsetIn,
    // offsetBalance,
    // loadBalance,
    // returns: statistics.returns,
    // memberValue: Math.round(netValue / membersCount),
    // invested: statistics.fund - statistics.balance,
    // liquidity: statistics.balance,
    // netAmount,
    // netValue,
  };
}

export type GetStatisticsResponse = {
  statistics: TransformedStatistics;
  members: TransformedMemberStat[];
};

export type TransformedStatistics = ReturnType<typeof statisticsTransform>;
export type TransformedMemberStat = ReturnType<typeof membersStatTransform>;

function membersStatTransform(member: Account) {
  return {
    id: member.id,
    slug: member.slug,
    link: `/dashboard/member/${member.slug}`,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    active: member.active,
  };
}
