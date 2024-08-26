"use server";

import prisma from "@/db";
import { Member, Passbook } from "@prisma/client";
import { differenceInMonths } from "date-fns";
import { enIN } from "date-fns/locale/en-IN";

function fetchMembers() {
  return prisma.member.findMany({
    include: {
      passbook: true,
    },
  });
}
type MemberToTransform = Member & {
  passbook: Passbook;
};

export function membersTableTransform(member: MemberToTransform) {
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

export async function membersTable() {
  const members = await fetchMembers();

  return members
    .map(membersTableTransform)
    .sort((a, b) => (a.name > b.name ? -1 : 1))
    .sort((a, b) => (a.status > b.status ? 1 : -1));
}

export type MemberTableType = ReturnType<typeof membersTableTransform>;
export type MembersTableType = Awaited<ReturnType<typeof membersTable>>;
