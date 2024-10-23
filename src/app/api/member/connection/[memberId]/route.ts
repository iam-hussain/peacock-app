import { NextResponse } from "next/server";

import prisma from "@/db";

function transformConnectionMemberVendor(input: {
  vendor: {
    name: string;
    active: boolean;
    owner: {
      firstName: string;
      lastName: string | null;
      avatar: string | null;
    } | null;
  };
  id: string;
  active: boolean;
}) {
  const {
    vendor: { owner, name, active },
    ...props
  } = input;
  const memberName = owner?.firstName
    ? `${owner.firstName} ${owner.lastName || ""}`
    : "";

  return {
    id: props.id,
    name: `${name}${owner?.firstName ? ` - ${owner.firstName} ${owner.lastName || " "}` : ""}`,
    vendorName: name,
    memberName,
    memberAvatar: owner?.avatar ? `/image/${owner.avatar}` : undefined,
    vendorActive: active,
    active: props.active,
  };
}

export type ConnectionMemberVendor = ReturnType<
  typeof transformConnectionMemberVendor
>;

export type GetConnectionMemberVendor = {
  connections: ConnectionMemberVendor[];
};

// GET Request to fetch the member's vendor connections
export async function GET(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  const { memberId } = params;

  const connections = await prisma.vendorProfitShare.findMany({
    where: { memberId },
    select: {
      id: true,
      active: true,
      vendor: {
        select: {
          name: true,
          active: true,
          owner: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    connections: connections.map(transformConnectionMemberVendor),
  });
}

// PATCH Request to update the member's vendor connections
export async function POST(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  const { memberId } = params;
  const data = await request.json();

  const updates = await Promise.all(
    data.map((update: { id: string; active: boolean }) =>
      prisma.vendorProfitShare.update({
        where: { id: update.id, memberId },
        data: { active: update.active },
      })
    )
  );

  return NextResponse.json({ updates });
}
