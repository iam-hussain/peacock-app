import { NextResponse } from "next/server";

import prisma from "@/db";
import { memberMonthsPassedString } from "@/lib/date";
import { getMemberClubStats } from "@/lib/member-club-stats";
import {
  membersTableTransform,
  TransformedLoan,
  TransformedMember,
  transformLoanForTable,
} from "@/transformers/account";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(
  request: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  try {
    const account = await prisma.account.findUniqueOrThrow({
      where: { username, isMember: true },
      include: { passbook: true },
    });

    const stats = await getMemberClubStats();
    const {
      memberTotalDeposit,
      totalReturnPerMember,
      expectedLoanProfitPerMember,
    } = stats;

    const memberLoan = transformLoanForTable(account);
    const memberData = membersTableTransform(
      account,
      memberTotalDeposit,
      totalReturnPerMember,
      expectedLoanProfitPerMember
    );

    return NextResponse.json({
      member: {
        ...memberLoan,
        ...memberData,
        ...memberMonthsPassedString(account.startAt),
      },
    });
  } catch (error) {
    console.error("Error fetching member by username:", error);
    return NextResponse.json(
      { message: "Failed to fetch member." },
      { status: 500 }
    );
  }
}

export type GetMemberByUsernameResponse = {
  member: TransformedMember &
    TransformedLoan &
    ReturnType<typeof memberMonthsPassedString>;
};
