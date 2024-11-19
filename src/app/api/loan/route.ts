import { Account, Passbook } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { calculateMonthsDifference, calculateTimePassed, getMonthsPassedString } from "@/lib/date";
import { MemberPassbookData } from "@/lib/type";

type LoanToTransform = Account & {
  passbook: Passbook;
};

export async function GET() {
  const loans = await prisma.account.findMany({
    where: {
      isMember: true,
    },
    include: {
      passbook: true,
    },
  });

  const transformedLoans = loans
    .map(transformLoanForTable)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.type > b.type ? -1 : 1))
    .sort((a, b) => (a.active > b.active ? -1 : 1));

  return NextResponse.json({
    accounts: transformedLoans,
  });
}

function transformLoanForTable(vendorInput: LoanToTransform) {
  const ONE_MONTH_RATE = 0.01;
  const { passbook, ...member } = vendorInput;
  const data = passbook.data as unknown as MemberPassbookData;

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
    id: member.id,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    joined: calculateMonthsDifference(new Date(), new Date(member.startAt)),
    startAt: member.startAt.getTime(),
    status: member.active ? "Active" : "Disabled",
    active: member.active,
    investAt: lastDate ? lastDate.getTime() : undefined,
    balance,
    ...loanData,
    details:  [],
  };
}

export type GetLoanResponse = {
  vendors: TransformedLoan[];
};

export type TransformedLoan = ReturnType<typeof transformLoanForTable>;
