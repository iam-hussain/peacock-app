"use server";

import prisma from "@/db";
import { calculateTotalDeposit, clubMonthsFromStart } from "@/lib/club";
import { Passbook } from "@prisma/client";

export async function getStatistics() {
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

  const currentIn = statistics.in - statistics.out;
  const totalDeposit = calculateTotalDeposit(membersCount) + 36000;
  const offsetBalance = statistics.offset - statistics.offsetIn;
  const netAmount = currentIn + statistics.returns;
  const netValue = totalDeposit + statistics.returns + statistics.offset;

  return {
    membersCount,
    totalMonths: clubMonthsFromStart(),
    deposit: currentIn,
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

export type StatisticsResponse = Awaited<ReturnType<typeof getStatistics>>;
