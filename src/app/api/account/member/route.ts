export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { getMemberTotalDepositUpToday } from "@/lib/club";
import { ClubPassbookData, VendorPassbookData } from "@/lib/type";
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

  const transformedMembers = members
    .map((each) =>
      membersTableTransform(each, memberTotalDeposit, totalReturnAmount)
    )
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.active > b.active ? -1 : 1));

  return NextResponse.json({ members: transformedMembers });
}

export type GetMemberResponse = { members: TransformedMember[] };
