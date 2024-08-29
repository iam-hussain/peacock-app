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

  const totalDeposit = calculateTotalDeposit(membersCount);
  const offsetBalance = statistics.offset - statistics.offsetIn;
  const netValue = statistics.in + statistics.returns + statistics.offset;

  return {
    membersCount,
    totalMonths: clubMonthsFromStart(),
    deposit: statistics.in + statistics.offsetIn,
    balance: totalDeposit - statistics.in + offsetBalance,
    offset: statistics.offsetIn,
    returns: statistics.returns,
    memberValue: netValue / membersCount,
    invested: statistics.fund - statistics.balance,
    liquidity: statistics.fund,
    netValue,
  };
}

export type StatisticsResponse = Awaited<ReturnType<typeof getStatistics>>;
