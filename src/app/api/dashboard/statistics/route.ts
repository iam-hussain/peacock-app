import { Passbook } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { calculateTotalDeposit, clubMonthsFromStart } from "@/lib/club";
import { calculateTimePassed } from "@/lib/date";

export async function GET() {
  const statistics = await prisma.passbook.findMany({
    where: {
      OR: [
        {
          type: "CLUB",
        },
        {
          type: "VENDOR",
          vendor: {
            type: "LEND",
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
  const loans = statistics.filter((e) => e.type !== "CLUB" && e.vendor);
  if (!club) {
    throw new Error("Invalid club statistics");
  }

  return NextResponse.json({
    success: true,
    statistics: statisticsTransform(club, membersCount, loans),
  });
}

const ONE_MONTH_RATE = 0.01;

function statisticsTransform(
  statistics: Passbook,
  membersCount: number,
  loans: ({
    vendor: {
      startAt: Date;
      endAt: Date | null;
    } | null;
  } & Passbook)[]
) {
  const loadBalance = loans
    .map((passbook) => {
      if (passbook.offset > 0 && passbook.recentDate) {
        const { monthsPassed, daysPassed } = calculateTimePassed(
          new Date(passbook.recentDate),
          new Date()
        );
        const interestForMonths =
          passbook.offset * ONE_MONTH_RATE * monthsPassed;
        const interestForDays =
          passbook.offset * ONE_MONTH_RATE * (daysPassed / 30);

        return (
          passbook.fund + interestForMonths + interestForDays - passbook.returns
        );
      }
      return passbook.fund - passbook.returns;
    })
    .reduce((a, b) => a + b, 0);

  const currentIn = statistics.in - statistics.out;
  const totalDeposit = calculateTotalDeposit(membersCount) + 36000;
  const offsetBalance =
    statistics.offset + statistics.loanOffset - statistics.offsetIn;
  const netAmount = currentIn + statistics.returns;
  const netValue =
    totalDeposit + statistics.returns + statistics.offset + loadBalance;

  return {
    membersCount,
    totalMonths: clubMonthsFromStart(),
    deposit: currentIn - statistics.offsetIn,
    balance: (totalDeposit - currentIn) + offsetBalance,
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
