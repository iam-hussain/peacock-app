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
        Array.isArray(e.passbook.loanHistory) &&
        e.passbook.loanHistory.length > 0
    )
    .map(transformLoanForTable)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.position > b.position ? 1 : -1));

  return NextResponse.json({
    accounts: transformedLoans,
  });
}

function transformLoanForTable(vendorInput: LoanToTransform) {
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

  const position = loans[loans.length - 1].endDate
    ? new Date(loans[loans.length - 1].startDate).getTime()
    : new Date().getTime();
  const totalInterestBalance = totalInterestAmount - totalInterestPaid;

  return {
    id: member.id,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    joined: calculateMonthsDifference(new Date(), new Date(member.startAt)),
    startAt: position,
    status: member.active ? "Active" : "Disabled",
    active: member.active,
    totalLoanTaken,
    totalLoanRepay,
    totalLoanBalance,
    totalInterestPaid,
    totalInterestBalance,
    totalInterestAmount,
    loanHistory,
    recentPassedString,
    position,
  };
}

export type GetLoanResponse = {
  accounts: TransformedLoan[];
};

export type TransformedLoan = ReturnType<typeof transformLoanForTable>;
