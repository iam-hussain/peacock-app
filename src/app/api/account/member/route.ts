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
  const totalOffsetAmount = members
    .map((e) => e.passbook.joiningOffset + e.passbook.delayOffset)
    .reduce((a, b) => a + b, 0);
  const memberTotalDeposit = getMemberTotalDepositUpToday();
  const activeMembersCount = members.filter((e) => e.active).length;
  const clubData = club.payload as ClubPassbookData;

  // console.log({ totalVendorProfit: clubData.totalVendorProfit });
  // const totalVendorProfit = Math.max(
  //   clubData.totalReturns - clubData.totalInvestment,
  //   0
  // );

  const totalProfitCollected =
    totalOffsetAmount + clubData.totalInterestPaid + clubData.totalVendorProfit;

  const availableProfitAmount =
    totalProfitCollected - clubData.totalMemberProfitWithdrawals;

  const totalReturnAmount = availableProfitAmount / activeMembersCount;

  const transformedMembers = members
    .map((each) =>
      membersTableTransform(each, memberTotalDeposit, totalReturnAmount)
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
  totalReturnAmount: number
) {
  const {
    passbook: { delayOffset, joiningOffset },
    ...account
  } = member;
  const {
    periodicDepositAmount = 0,
    offsetDepositAmount = 0,
    totalDepositAmount = 0,
    withdrawalAmount = 0,
    accountBalance = 0,
    clubHeldAmount = 0,
  } = member.passbook.payload as unknown as MemberPassbookData;

  const totalOffsetAmount = delayOffset + joiningOffset;
  let totalBalanceAmount =
    memberTotalDeposit + totalOffsetAmount - accountBalance;
  const totalPeriodBalanceAmount =
    totalBalanceAmount > memberTotalDeposit
      ? memberTotalDeposit - accountBalance
      : 0;
  const offsetBalanceAmount =
    accountBalance - (memberTotalDeposit + totalOffsetAmount);

  const totalOffsetBalanceAmount =
    totalPeriodBalanceAmount > 0 ? totalOffsetAmount : offsetBalanceAmount;

  if (!member.active) {
    totalBalanceAmount = totalBalanceAmount + totalReturnAmount;
    totalReturnAmount = 0;
  }

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
    periodicDepositAmount,
    offsetDepositAmount,
    totalOffsetBalanceAmount,
    totalPeriodBalanceAmount,
    totalBalanceAmount,
    totalReturnAmount: totalReturnAmount || 0,
    clubHeldAmount,
    delayOffset,
    joiningOffset,
    netValue: accountBalance + (totalReturnAmount || 0),
    account: { ...account, delayOffset, joiningOffset },
  };
}

export type GetMemberResponse = {
  members: TransformedMember[];
};

export type TransformedMember = ReturnType<typeof membersTableTransform>;
