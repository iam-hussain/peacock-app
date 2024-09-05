import { Member, Passbook } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { memberTotalDepositAmount } from "@/lib/club";
import { calculateMonthsDifference } from "@/lib/date";

type MemberToTransform = Member & {
  passbook: Passbook;
};

export async function GET(request: Request) {
  const members = await prisma.member.findMany({
    include: {
      passbook: true,
    },
  });
  const memberTotalDeposit = memberTotalDepositAmount();

  const transformedMembers = members
    .map((each) => membersTableTransform(each, memberTotalDeposit))
    .sort((a, b) => (a.name > b.name ? 1 : -1));

  return NextResponse.json({
    members: transformedMembers,
  });
}

function membersTableTransform(
  member: MemberToTransform,
  memberTotalDeposit: number
) {
  const { passbook, ...rawMember } = member;
  const offsetBalance = member.passbook.offset - member.passbook.offsetIn;
  const periodBalance =
    memberTotalDeposit - (member.passbook.periodIn - member.passbook.out);
  const deposit = member.passbook.periodIn + member.passbook.offsetIn;
  return {
    id: member.id,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    username: member.username,
    avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    joined: calculateMonthsDifference(new Date(), new Date(member.joinedAt)),
    joinedAt: member.joinedAt.getTime(),
    status: member.active ? "Active" : "Disabled",
    active: member.active,
    deposit: deposit - member.passbook.out,
    periodIn: member.passbook.periodIn,
    offsetDeposit: member.passbook.offsetIn,
    offsetBalance,
    periodBalance,
    balance: periodBalance + offsetBalance,
    returns: member.passbook.returns || 0,
    clubFund: member.passbook.fund,
    netValue:
      member.passbook.in + member.passbook.returns - member.passbook.out,
    member: rawMember,
  };
}

export type GetMemberResponse = {
  members: TransformedMember[];
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      id,
      firstName,
      lastName,
      username,
      phone,
      email,
      avatar,
      active,
      joinedAt,
    } = data;

    // Validate required fields
    if (!firstName && !id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const commonData = {
      firstName: firstName || undefined,
      lastName: lastName ?? undefined,
      username:
        username || firstName?.toLowerCase().trim().replace(/\s+/g, "_"),
      phone: phone ?? undefined,
      email: email ?? undefined,
      avatar: avatar ?? undefined,
      joinedAt: new Date(joinedAt || new Date()),
      active: active ?? true,
    };

    let member;

    if (id) {
      // Update existing member
      member = await prisma.member.update({
        where: { id },
        data: commonData,
      });
    } else {
      const vendors = await prisma.vendor.findMany({
        select: { id: true, active: true },
      });
      // Create a new member
      member = await prisma.member.create({
        data: {
          ...commonData,
          passbook: {
            create: { type: "MEMBER" },
          },
          profitShares: {
            createMany: {
              data: vendors.map((e) => ({
                vendorId: e.id,
                active: e.active,
              })),
            },
          },
        },
      });
    }

    revalidatePath("/members");

    return NextResponse.json({ member }, { status: 200 });
  } catch (error) {
    console.error("Error creating/updating member:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export type TransformedMember = ReturnType<typeof membersTableTransform>;
