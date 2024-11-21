import { $Enums } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { clubMonthsFromStart, getClubTotalDepositUpToday } from "@/lib/club";
import { calculateInterestByAmount } from "@/lib/helper";
import {
  ClubPassbookData,
  LoanHistoryEntry,
  MemberPassbookData,
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
};

export async function GET() {
  const [passbooks, membersCount] = await Promise.all([
    prisma.passbook.findMany({
      where: {
        type: { in: ["CLUB", "MEMBER"] },
      },
      select: {
        type: true,
        loanHistory: true,
        payload: true,
      },
    }),
    prisma.account.count({
      where: {
        isMember: true,
        active: true,
      },
    }),
  ]);
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
      membersCount
    ),
  });
}

function statisticsTransform(
  clubPassbook: StatClubPassbook,
  membersPassbooks: StatMemberPassbook[],
  membersCount: number
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
    currentClubBalance,
    netClubBalance,
    totalInvestment,
    totalReturns,
    totalProfit,
    totalLoanTaken,
    totalLoanRepay,
    totalLoanBalance,
    totalInterestPaid,
    totalLoanProfit,
    totalVendorProfit,
    totalLoanOffsetAmount,
    totalVendorOffsetAmount,
    loanOffsetBalance,
    loanOffsetPaid,
    vendorOffsetBalance,
    vendorOffsetPaid,
  } = clubPassbook.payload as ClubPassbookData;

  return {
    membersCount,
    clubMonthsPassed: clubMonthsFromStart(),
    totalMemberWithdrawals,
    totalMemberPeriodicDeposits:
      totalMemberPeriodicDeposits - totalMemberWithdrawals,
    expectedTotalMemberPeriodicDeposits,
    totalMemberPeriodicDepositsBalance:
      expectedTotalMemberPeriodicDeposits -
      (totalMemberPeriodicDeposits - totalMemberWithdrawals),
    expectedTotalLoanInterestAmount,
    totalMemberOffsetDeposits,
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
    totalLoanProfit,
    totalVendorProfit,
    totalLoanOffsetAmount,
    totalVendorOffsetAmount,
    loanOffsetBalance,
    loanOffsetPaid,
    vendorOffsetBalance,
    vendorOffsetPaid,
    totalOffsetPaid: loanOffsetPaid + vendorOffsetPaid,
    totalOffsetBalance: loanOffsetBalance + vendorOffsetBalance,
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
};

export type TransformedStatistics = ReturnType<typeof statisticsTransform>;
