import { NextResponse } from "next/server";
import { Member, Passbook } from "@prisma/client";
import prisma from "@/db";
import { dateFormat, monthsDiff, newDate } from "@/lib/date";
import { memberTotalDepositAmount } from "@/lib/club";

type MemberToTransform = Member & {
  passbook: Passbook;
};

export type MemberResponse = ReturnType<typeof membersTableTransform>;

function membersTableTransform(
  member: MemberToTransform,
  memberTotalDeposit: number
) {
  const offsetBalance = member.passbook.offset - member.passbook.offsetIn;
  const periodBalance = memberTotalDeposit - member.passbook.periodIn;
  const deposit = member.passbook.periodIn + member.passbook.offsetIn;
  return {
    id: member.id,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    username: member.username,
    avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    joined: monthsDiff(new Date(), new Date(member.joinedAt)),
    joinedAt: dateFormat(member.joinedAt),
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

  return NextResponse.json({
    members: transformedMembers,
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { id, firstName, lastName, username, phone, email, avatar, active } =
      data;

    // Validate required fields
    if (!firstName && !id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const commonData = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      username:
        username || firstName?.toLowerCase().trim().replace(/\s+/g, "_"),
      phone: phone || undefined,
      email: email || undefined,
      avatar: avatar || undefined,
      active: typeof active === "boolean" ? active : true,
    };

    let member;

    if (id) {
      // Update existing member
      member = await prisma.member.update({
        where: { id },
        data: commonData,
      });
    } else {
      // Create a new member
      member = await prisma.member.create({
        data: {
          ...commonData,
          passbook: {
            create: { type: "MEMBER" },
          },
        },
      });
    }

    return NextResponse.json({ member }, { status: 200 });
  } catch (error) {
    console.error("Error creating/updating member:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
