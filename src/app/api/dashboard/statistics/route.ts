import { Passbook } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { loanCalculator } from "@/lib/calc";
import { calculateTotalDeposit, clubMonthsFromStart } from "@/lib/club";

export async function GET() {
  const statistics = await prisma.passbook.findMany({
    where: {
      OR: [
        {
          type: "CLUB",
        },
        {
          vendor: {
            type: "LEND",
            active: true,
          },
        },
      ],
    },
    include: {
      vendor: {
        select: {
          startAt: true,
          endAt: true,
        },
      },
    },
  });

  const membersCount = await prisma.member.count({
    where: {
      active: true,
    },
  });
  const club = statistics.find((e) => e.type === "CLUB");
  const vendors = statistics.filter((e) => e.type !== "CLUB" && e.vendor);
  if (!club) {
    throw new Error("Invalid club statistics");
  }

  return NextResponse.json({
    success: true,
    statistics: statisticsTransform(club, membersCount, vendors),
  });
}

function statisticsTransform(
  statistics: Passbook,
  membersCount: number,
  vendors: ({
    vendor: {
      startAt: Date;
      endAt: Date | null;
    } | null;
  } & Passbook)[]
) {
  const loadBalance = vendors
    .map(({ vendor, ...passbook }) => {
      if (!vendor) {
        return 0;
      }
      const { totalAmount } = loanCalculator(
        passbook.in,
        vendor.startAt,
        vendor?.endAt
      );

      return totalAmount > 0 ? totalAmount - passbook.out : 0;
    })
    .reduce((a, b) => a + b, 0);

  const currentIn = statistics.in - statistics.out;
  const totalDeposit = calculateTotalDeposit(membersCount) + 36000;
  const offsetBalance = statistics.offset - statistics.offsetIn;
  const netAmount = currentIn + statistics.returns;
  const netValue =
    totalDeposit + statistics.returns + statistics.offset + loadBalance;

  return {
    membersCount,
    totalMonths: clubMonthsFromStart(),
    deposit: currentIn - statistics.offsetIn,
    balance: totalDeposit - currentIn + offsetBalance,
    offset: statistics.offset,
    offsetIn: statistics.offsetIn,
    offsetBalance,
    loadBalance,
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

export type TransformedStatistics = ReturnType<typeof statisticsTransform>;
