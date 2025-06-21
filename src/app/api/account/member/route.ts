export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { getMemberTotalDepositUpToday } from "@/lib/club";
import { calculateInterestByAmount } from "@/lib/helper";
import {
  ClubPassbookData,
  LoanHistoryEntry,
  VendorPassbookData,
} from "@/lib/type";
import {
  membersTableTransform,
  TransformedMember,
} from "@/transformers/account";

export async function POST() {
  revalidateTag("api");

  const [members, club, vendorsPass] = await Promise.all([
    prisma.account.findMany({
      where: { isMember: true },
      include: { passbook: true },
    }),
    prisma.passbook.findFirstOrThrow({
      where: { type: "CLUB" },
      select: { payload: true },
    }),
    prisma.passbook.findMany({
      where: { type: "VENDOR" },
      select: { payload: true },
    }),
  ]);
  const totalOffsetAmount = members
    .map((e) => e.passbook.joiningOffset + e.passbook.delayOffset)
    .reduce((a, b) => a + b, 0);
  const memberTotalDeposit = getMemberTotalDepositUpToday();
  const activeMembersCount = members.filter((e) => e.active).length;
  const clubData = club.payload as ClubPassbookData;

  const totalVendorProfit = vendorsPass
    .map((e) => {
      const { totalInvestment = 0, totalReturns = 0 } =
        e.payload as VendorPassbookData;
      return Math.max(totalReturns - totalInvestment, 0);
    })
    .reduce((a, b) => a + b, 0);

  const totalProfitCollected =
    totalOffsetAmount + clubData.totalInterestPaid + totalVendorProfit;

  const availableProfitAmount =
    totalProfitCollected - clubData.totalMemberProfitWithdrawals;

  const totalReturnAmount = availableProfitAmount / activeMembersCount;

  // Calculate total interest amount from all members' loan histories
  const totalInterestAmount = members.reduce((sum, member) => {
    const loanHistory = (member.passbook.loanHistory ||
      []) as LoanHistoryEntry[];
    return (
      sum +
      loanHistory.reduce((acc, entry) => {
        const { interestAmount } = calculateInterestByAmount(
          entry.amount,
          entry.startDate,
          entry?.endDate
        );
        return acc + interestAmount;
      }, 0)
    );
  }, 0);

  const totalInterestBalance = totalInterestAmount - clubData.totalInterestPaid;
  const memberExpectedLoanProfit =
    activeMembersCount > 0 ? totalInterestBalance / activeMembersCount : 0;

  const transformedMembers = members
    .map((each) =>
      membersTableTransform(
        each,
        memberTotalDeposit,
        activeMembersCount > 0 ? totalReturnAmount : 0,
        memberExpectedLoanProfit
      )
    )
    .sort((a, b) => {
      // Sort active first, then by name
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return NextResponse.json({ members: transformedMembers });
}

export type GetMemberResponse = { members: TransformedMember[] };
