"use server";

import prisma from "@/db";

type MemberToTransform = {
  id: string;
  firstName: string;
  lastName: string | null;
  active: boolean;
};

function membersSelectTransform(member: MemberToTransform) {
  return {
    id: member.id,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    active: member.active,
  };
}

export async function membersSelect() {
  const members = await prisma.member.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      active: true,
    },
  });

  return members
    .map(membersSelectTransform)
    .sort((a, b) => (a.name > b.name ? 1 : -1));
}

export type MemberSelectType = ReturnType<typeof membersSelectTransform>;
export type MembersSelectResponse = Awaited<ReturnType<typeof membersSelect>>;
