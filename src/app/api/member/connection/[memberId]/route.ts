import { NextResponse } from "next/server";

import prisma from "@/db";

function transformConnectionMemberVendor(input: {
  vendor: {
    active: boolean;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  };
  id: string;
  active: boolean;
}) {
  const { vendor, ...props } = input;

  return {
    id: props.id,
    name: `${vendor.firstName}${vendor.lastName ? ` ${vendor.lastName}` : ""}`,
    avatar: vendor?.avatar ? `/image/${vendor.avatar}` : undefined,
    active: props.active,
    memberActive: vendor.active,
  };
}

export type ConnectionMemberVendor = ReturnType<
  typeof transformConnectionMemberVendor
>;

export type GetConnectionMemberVendor = {
  connections: ConnectionMemberVendor[];
  loanOffsetAmount: number;
  passbookId: string;
};

// GET Request to fetch the member's vendor connections
export async function GET(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  const { memberId } = params;

  const [connections, passbook] = await Promise.all([
    prisma.profitShare.findMany({
      where: { memberId },
      select: {
        id: true,
        active: true,
        vendor: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            active: true,
          },
        },
      },
    }),
    prisma.passbook.findFirstOrThrow({
      where: {
        account: {
          id: memberId,
        },
        type: "MEMBER",
      },
      select: {
        id: true,
        loanOffsetAmount: true,
      },
    }),
  ]);

  return NextResponse.json({
    connections: connections.map(transformConnectionMemberVendor),
    loanOffsetAmount: Number(passbook.loanOffsetAmount) || 0,
    passbookId: passbook?.id,
  });
}

// PATCH Request to update the member's vendor connections
export async function POST(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  const { memberId } = params;
  const { connections, current, loanOffsetAmount, passbookId } =
    await request.json();

  if (
    !connections ||
    !passbookId ||
    !Array.isArray(connections) ||
    !(typeof loanOffsetAmount === "number" && loanOffsetAmount >= 0) ||
    !(typeof current === "number" && current >= 0)
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.passbook.update({
      where: {
        id: passbookId,
      },
      data: {
        loanOffsetAmount: loanOffsetAmount,
      },
    }),
    ...connections.map((update: { id: string; active: boolean }) =>
      prisma.profitShare.update({
        where: { id: update.id, memberId },
        data: { active: update.active },
      })
    ),
  ]);

  return NextResponse.json({ connections, loanOffsetAmount });
}
