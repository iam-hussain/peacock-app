import { NextResponse } from "next/server";
import { differenceInMonths } from "date-fns";
import { Member, Passbook } from "@prisma/client";
import prisma from "@/db";
import { months } from "moment-timezone";
import { dateFormat, monthsDiff, newDate } from "@/lib/date";
import { memberTotalDepositAmount } from "@/lib/club";

type memberInput = Member & {
  passbook: Passbook;
};

export function membersTableTransform(
  member: memberInput,
  memberTotalDeposit: number
) {
  const offsetBalance = member.passbook.offsetIn - member.passbook.offset;
  const periodBalance = memberTotalDeposit - member.passbook.periodIn;
  const deposit = member.passbook.periodIn + member.passbook.offsetIn;
  // console.log({ member, periodBalance, offsetBalance, memberTotalDeposit });
  return {
    id: member.id,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    username: member.username,
    avatar: member.avatar
      ? `/image/${member.avatar}`
      : "/image/no_image_available.jpeg",
    joined: monthsDiff(new Date(), new Date(member.joinedAt)),
    joinedAt: dateFormat(member.joinedAt),
    status: member.active ? "Active" : "Disabled",
    active: member.active,
    deposit,
    periodIn: member.passbook.periodIn,
    offsetDeposit: member.passbook.offsetIn,
    offsetBalance,
    periodBalance,
    balance: periodBalance + offsetBalance,
    returns: member.passbook.returns || 0,
    clubFund: member.passbook.fund,
    netValue: deposit + member.passbook.returns,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const members = await prisma.member.findMany({
    skip: (page - 1) * limit,
    take: limit,
    include: {
      passbook: true,
    },
  });

  const memberTotalDeposit = memberTotalDepositAmount();
  const transformedMembers = members
    .map((each) => membersTableTransform(each, memberTotalDeposit))
    .sort((a, b) => (a.name > b.name ? 1 : -1));
  // .sort((a, b) => (a.status > b.status ? 1 : -1));

  // const totalMembers = await prisma.member.count();

  return NextResponse.json({
    members: transformedMembers,
    // total: totalMembers,
    // totalPages: Math.ceil(totalMembers / limit),
  });
}
