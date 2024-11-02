import { NextResponse } from "next/server";

import prisma from "@/db";

function transformConnectionVendorMember(input: {
  member: {
    active: boolean;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  };
  id: string;
  active: boolean;
}) {
  const { member, ...props } = input;
  return {
    id: props.id,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member?.avatar ? `/image/${member.avatar}` : undefined,
    active: props.active,
    memberActive: member.active,
  };
}

export type ConnectionVendorMember = ReturnType<
  typeof transformConnectionVendorMember
>;

export type GetConnectionVendorMember = {
  connections: ConnectionVendorMember[];
};

// GET: Fetch all member connections for a vendor
export async function GET(
  request: Request,
  { params }: { params: { vendorId: string } }
) {
  const { vendorId } = params;

  const connections = await prisma.vendorProfitShare.findMany({
    where: { vendorId },
    select: {
      id: true,
      active: true,
      member: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
          active: true,
        },
      },
    },
  });

  return NextResponse.json({
    connections: connections.map(transformConnectionVendorMember),
  });
}

// PATCH: Update member connections for a vendor
export async function POST(
  request: Request,
  { params }: { params: { vendorId: string } }
) {
  const { vendorId } = params;
  const { connections } = await request.json();

  const updates = await prisma.$transaction(
    connections.map((update: { id: string; active: boolean }) =>
      prisma.vendorProfitShare.update({
        where: { id: update.id, vendorId },
        data: { active: update.active },
      })
    )
  );

  return NextResponse.json({ connections });
}
