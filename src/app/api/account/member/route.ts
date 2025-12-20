export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getMemberClubStats } from "@/lib/calculators/member-club-stats";
import {
  membersTableTransform,
  TransformedMember,
} from "@/transformers/account";

export async function POST(request: NextRequest) {
  try {
    const { requireAuth } = await import("@/lib/core/auth");
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

    const response = { members: transformedMembers };

    // Generate ETag from response content hash for cache validation
    const responseString = JSON.stringify(response);
    const etag = `"${Buffer.from(responseString).toString("base64").slice(0, 16)}"`;

    // Check if client has cached version
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 }); // Not Modified
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, no-cache, must-revalidate",
        ETag: etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
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
