import { Account, Passbook } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { calculateMonthsDifference } from "@/lib/date";
import { calculateInterestByAmount } from "@/lib/helper";
import { LoanHistoryEntry, MemberPassbookData } from "@/lib/type";

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
    .filter(
      (e) =>
        e.active ||
        (Array.isArray(e.passbook.loanHistory) &&
          e.passbook.loanHistory.length > 0)
    )
    .map(transformLoanForTable)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.active > b.active ? -1 : 1));

  return NextResponse.json({
    accounts: transformedLoans,
  });
}

export function transformLoanForTable(vendorInput: LoanToTransform) {
  const { passbook, ...member } = vendorInput;
  const {
    totalLoanTaken = 0,
    totalLoanRepay = 0,
    totalLoanBalance = 0,
    totalInterestPaid = 0,
  } = passbook.payload as unknown as MemberPassbookData;
  const loans = (passbook.loanHistory || []) as unknown as LoanHistoryEntry[];

  let totalInterestAmount = 0;
  let recentPassedString: any = "";

  const loanHistory = loans.map((loan) => {
    const {
      interestAmount,
      daysInMonth,
      daysPassed,
      monthsPassed,
      monthsPassedString,
      interestForDays,
      interestPerDay,
    } = calculateInterestByAmount(loan.amount, loan.startDate, loan?.endDate);

    totalInterestAmount += interestAmount;
    recentPassedString = monthsPassedString;
    return {
      ...loan,
      startDate: new Date(loan.startDate).getTime(),
      endDate: new Date(loan.endDate || new Date()).getTime(),
      totalInterestAmount,
      interestAmount,
      daysInMonth,
      daysPassed,
      monthsPassed,
      monthsPassedString,
      interestForDays,
      interestPerDay,
    };
  });

  const totalInterestBalance = totalInterestAmount - totalInterestPaid;

  return {
    id: member.id,
    slug: member.slug,
    link: `/dashboard/member/${member.slug}`,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    joined: calculateMonthsDifference(new Date(), new Date(member.startAt)),
    startAt: loans.length
      ? new Date(loans[loans.length - 1].startDate).getTime()
      : 0,
    status: member.active ? "Active" : "Disabled",
    active: totalLoanBalance > 0,
    totalLoanTaken,
    totalLoanRepay,
    totalLoanBalance,
    totalInterestPaid,
    totalInterestBalance,
    totalInterestAmount,
    loanHistory,
    recentPassedString,
  };
}

export type GetLoanResponse = {
  accounts: TransformedLoan[];
};

export type TransformedLoan = ReturnType<typeof transformLoanForTable>;
