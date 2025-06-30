export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getMemberClubStats } from "@/lib/member-club-stats";
import {
  membersTableTransform,
  TransformedMember,
} from "@/transformers/account";

export async function POST() {
  revalidateTag("api");

  const stats = await getMemberClubStats();
  const {
    members,
    memberTotalDeposit,
    totalReturnPerMember,
    expectedLoanProfitPerMember,
  } = stats;

  const transformedMembers = members
    .map((each) =>
      membersTableTransform(
        each,
        memberTotalDeposit,
        totalReturnPerMember,
        expectedLoanProfitPerMember
      )
    )
    .sort((a, b) => {
      // Sort active first, then by name
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return NextResponse.json({ members: transformedMembers });
}

export type GetMemberResponse = { members: TransformedMember[] };
