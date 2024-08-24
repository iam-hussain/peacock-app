import { NextResponse } from "next/server";
import { differenceInMonths } from "date-fns";
import { Member, Passbook } from "@prisma/client";
import prisma from "@/db";

type memberInput = Member & {
  passbook: Passbook;
};

export function membersTableTransform(member: memberInput) {
  console.log({ member });
  return {
    id: member.id,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    username: member.username,
    avatar: member.avatar
      ? `/image/${member.avatar}`
      : "/image/no_image_available.jpeg",
    joined: `${differenceInMonths(new Date(), member.joinedAt)} months`,
    status: member.active ? "Active" : "Disabled",
    deposit: member.passbook.periodIn,
    offsetDeposit: member.passbook.offsetIn,
    offsetBalance: member.passbook.offset - member.passbook.offsetIn,
    returns: 0,
    clubFund: member.passbook.fund,
    netValue: member.passbook.balance - member.passbook.out,
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

  const transformedMembers = members
    .map(membersTableTransform)
    .sort((a, b) => (a.name > b.name ? 1 : -1));
  // .sort((a, b) => (a.status > b.status ? 1 : -1));

  const totalMembers = await prisma.member.count();

  return NextResponse.json({
    members: transformedMembers,
    total: totalMembers,
    totalPages: Math.ceil(totalMembers / limit),
  });
}
