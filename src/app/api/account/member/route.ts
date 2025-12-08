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
  try {
    const { requireAuth } = await import("@/lib/auth");
    await requireAuth();

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
  } catch (error: any) {
    console.error("Error fetching members:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export type GetMemberResponse = { members: TransformedMember[] };
