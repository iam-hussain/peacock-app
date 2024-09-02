import prisma from "@/db";
import { NextResponse } from "next/server";

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

export type TransformedMemberSelect = ReturnType<typeof membersSelectTransform>;

export async function GET(request: Request) {
  const members = await prisma.member.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      active: true,
    },
  });

  return NextResponse.json(
    members
      .map(membersSelectTransform)
      .sort((a, b) => (a.name > b.name ? 1 : -1))
  );
}
