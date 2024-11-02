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
  loanOffset: number;
  loanPassbookId: string;
};

// GET Request to fetch the member's vendor connections
export async function GET(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  const { memberId } = params;

  const [connections, passbook] = await Promise.all([
    prisma.vendorProfitShare.findMany({
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
    }),
    prisma.passbook.findFirst({
      where: {
        member: {
          id: memberId,
        },
        type: "MEMBER",
      },
      select: {
        loanOffset: true,
        id: true,
      },
    }),
  ]);

  return NextResponse.json({
    connections: connections.map(transformConnectionMemberVendor),
    loanOffset: passbook?.loanOffset || 0,
    loanPassbookId: passbook?.id,
  });
}

// PATCH Request to update the member's vendor connections
export async function POST(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  const { memberId } = params;
  const { connections, current, loanOffset, loanPassbookId } =
    await request.json();

  if (
    !connections ||
    !loanPassbookId ||
    !Array.isArray(connections) ||
    !(typeof loanOffset === "number" && loanOffset >= 0) ||
    !(typeof current === "number" && current >= 0)
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { _sum } =
    (await prisma.passbook.aggregate({
      _sum: {
        loanOffset: true,
      },
      where: {
        type: "MEMBER",
        id: { not: loanPassbookId },
      },
    })) || {};

  await prisma.$transaction([
    prisma.passbook.update({
      where: {
        id: loanPassbookId,
      },
      data: {
        loanOffset,
      },
    }),
    ...connections.map((update: { id: string; active: boolean }) =>
      prisma.vendorProfitShare.update({
        where: { id: update.id, memberId },
        data: { active: update.active },
      })
    ),
    prisma.passbook.updateMany({
      where: {
        type: "CLUB",
      },
      data: {
        loanOffset: Number(_sum?.loanOffset || 0) + loanOffset,
      },
    }),
  ]);

  return NextResponse.json({ connections, loanOffset });
}
