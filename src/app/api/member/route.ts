import { Account, Passbook } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { getMemberTotalDepositUpToday } from "@/lib/club";
import { calculateMonthsDifference } from "@/lib/date";
import { ClubPassbookData, MemberPassbookData } from "@/lib/type";

type MemberToTransform = Account & {
  passbook: Passbook;
};

export async function GET() {
  const [members, club] = await Promise.all([
    prisma.account.findMany({
      where: {
        isMember: true,
      },
      include: {
        passbook: true,
      },
    }),
    prisma.passbook.findFirstOrThrow({
      where: {
        type: "CLUB",
      },
      select: {
        payload: true,
      },
    }),
  ]);

  const memberTotalDeposit = getMemberTotalDepositUpToday();
  const activeMembersCount = members.filter((e) => e.active).length;
  const transformedMembers = members
    .map((each) =>
      membersTableTransform(
        each,
        memberTotalDeposit,
        club.payload as ClubPassbookData,
        activeMembersCount
      )
    )
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.active > b.active ? -1 : 1));

  return NextResponse.json({
    members: transformedMembers,
  });
}

function membersTableTransform(
  member: MemberToTransform,
  memberTotalDeposit: number,
  clubData: ClubPassbookData,
  activeMembersCount: number
) {
  const {
    periodicDepositAmount = 0,
    offsetDepositAmount = 0,
    totalDepositAmount = 0,
    withdrawalAmount = 0,
    accountBalance = 0,
    clubHeldAmount = 0,
    totalVendorOffsetAmount = 0,
    totalLoanOffsetAmount = 0,
    // totalLoanTaken,
    // totalLoanRepay,
    // totalLoanBalance,
    // totalInterestPaid,
  } = member.passbook.payload as unknown as MemberPassbookData;

  const totalOffsetAmount = totalVendorOffsetAmount + totalLoanOffsetAmount;
  const totalBalanceAmount =
    memberTotalDeposit + totalOffsetAmount - accountBalance;
  const totalPeriodBalanceAmount =
    totalBalanceAmount > memberTotalDeposit
      ? memberTotalDeposit - accountBalance
      : 0;
  const offsetBalanceAmount =
    accountBalance - (memberTotalDeposit + totalOffsetAmount);

  const totalOffsetBalanceAmount =
    totalPeriodBalanceAmount > 0 ? totalOffsetAmount : offsetBalanceAmount;

  const totalReturnAmount =
    (clubData.totalLoanProfit + clubData.totalVendorProfit) /
    activeMembersCount;

  return {
    id: member.id,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    joined: calculateMonthsDifference(new Date(), new Date(member.startAt)),
    startAt: member.startAt.getTime(),
    status: member.active ? "Active" : "Disabled",
    active: member.active,
    totalDepositAmount: totalDepositAmount - withdrawalAmount,
    totalOffsetAmount,
    totalVendorOffsetAmount,
    totalLoanOffsetAmount,
    periodicDepositAmount,
    offsetDepositAmount,
    totalOffsetBalanceAmount,
    totalPeriodBalanceAmount,
    totalBalanceAmount,
    totalReturnAmount: totalReturnAmount || 0,
    clubHeldAmount,
    netValue: accountBalance + (totalReturnAmount || 0),
    member: { ...member, passbook: null },
  };
}

export type GetMemberResponse = {
  members: TransformedMember[];
};

export type TransformedMember = ReturnType<typeof membersTableTransform>;
