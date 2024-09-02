import prisma from "@/db";
import { calculateTotalDeposit, clubMonthsFromStart } from "@/lib/club";
import { Passbook } from "@prisma/client";
import { NextResponse } from "next/server";

export type TransformedStatistics = ReturnType<typeof statisticsTransform>;

function statisticsTransform(statistics: Passbook, membersCount: number) {
  const currentIn = statistics.in - statistics.out;
  const totalDeposit = calculateTotalDeposit(membersCount) + 36000;
  const offsetBalance = statistics.offset - statistics.offsetIn;
  const netAmount = currentIn + statistics.returns;
  const netValue = totalDeposit + statistics.returns + statistics.offset;

  return {
    membersCount,
    totalMonths: clubMonthsFromStart(),
    deposit: currentIn - statistics.offsetIn,
    balance: totalDeposit - currentIn + offsetBalance,
    offset: statistics.offset,
    offsetIn: statistics.offsetIn,
    offsetBalance,
    returns: statistics.returns,
    memberValue: Math.round(netValue / membersCount),
    invested: statistics.fund - statistics.balance,
    liquidity: statistics.balance,
    netAmount,
    netValue,
  };
}

export type GetStatisticsResponse = {
  statistics: TransformedStatistics;
};

export async function GET() {
  const statistics = await prisma.passbook.findFirst({
    where: {
      type: "CLUB",
    },
  });
  const membersCount = await prisma.member.count({
    where: {
      active: true,
    },
  });
  if (!statistics) {
    throw new Error("Invalid club statistics");
  }

  return NextResponse.json({
    success: true,
    statistics: statisticsTransform(statistics, membersCount),
  });
}
