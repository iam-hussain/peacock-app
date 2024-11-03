import { Passbook, Vendor } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { calculateTimePassed, getMonthsPassedString } from "@/lib/date";

type LoanToTransform = Vendor & {
  passbook: Passbook;
  owner: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  } | null;
};

export async function GET() {
  const vendors = await prisma.vendor.findMany({
    where: {
      type: "LEND",
    },
    include: {
      owner: {
        select: {
          id: true,
          avatar: true,
          firstName: true,
          lastName: true,
        },
      },
      passbook: true,
    },
  });

  const transformedLoans = vendors
    .map(transformLoanForTable)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.type > b.type ? -1 : 1))
    .sort((a, b) => (a.active > b.active ? -1 : 1));

  return NextResponse.json({
    vendors: transformedLoans,
  });
}

function transformLoanForTable(vendorInput: LoanToTransform) {
  const ONE_MONTH_RATE = 0.01;
  const { passbook, owner, ...vendor } = vendorInput;

  const recentDate = passbook?.recentDate
    ? new Date(passbook?.recentDate)
    : undefined;
  const lastDate = passbook?.lastDate
    ? new Date(passbook?.lastDate)
    : undefined;
  const memberName = `${owner?.firstName} ${owner?.lastName || " "}`.trim();

  const loanData: any = {
    nextDueDate: null,
    invest: passbook.in,
    profit: passbook.out,
    account: passbook.offset,
    returns: passbook.returns || 0,
    expected: passbook.fund || 0,
    expectedMonth: null,
    current: 0,
    recentReturns: "",
    recentInvest: "",
  };

  if (passbook.offset > 0 && recentDate) {
    const recentReturnsDate = calculateTimePassed(
      new Date(recentDate),
      new Date()
    );

    const recentInvestDate = calculateTimePassed(
      new Date(lastDate || ""),
      new Date()
    );

    // Interest for months and days
    const interestForMonths =
      passbook.offset * ONE_MONTH_RATE * recentReturnsDate.monthsPassed;
    const interestForDays =
      passbook.offset * ONE_MONTH_RATE * (recentReturnsDate.daysPassed / 30);

    loanData.expected = passbook.fund + interestForMonths;
    loanData.current =
      passbook.fund + interestForMonths + interestForDays - loanData.returns;
    loanData.expectedMonth = recentReturnsDate.recentStartDate.getTime();
    loanData.recentReturns = getMonthsPassedString(
      recentReturnsDate.monthsPassed,
      recentReturnsDate.daysPassed
    );
    loanData.recentInvest = lastDate
      ? getMonthsPassedString(
          recentInvestDate.monthsPassed,
          recentInvestDate.daysPassed
        )
      : "";
  }

  const actualBalance = loanData.expected - passbook.returns;
  const balance = loanData.current > 0 ? loanData.current : actualBalance;
  return {
    id: vendor.id,
    name: memberName,
    vendorName: "Loan",
    searchName: memberName.trim(),
    type: vendor.type,
    memberName,
    memberAvatar: owner?.avatar ? `/image/${owner.avatar}` : undefined,
    startAt: recentDate ? recentDate.getTime() : undefined,
    investAt: lastDate ? lastDate.getTime() : undefined,
    active: passbook.offset > 0,
    balance,
    ...loanData,
    vendor: { ...vendor, calcReturns: passbook.calcReturns },
    details: passbook.addon || [],
  };
}

export type GetLoanResponse = {
  vendors: TransformedLoan[];
};

export type TransformedLoan = ReturnType<typeof transformLoanForTable>;
