export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { isLoggedIn: false, user: null },
        { status: 200 }
      );
    }

    // Format user response
    const responseUser =
      user.kind === "admin"
        ? {
            kind: "admin" as const,
            username: "admin" as const,
            role: "SUPER_ADMIN" as const,
            id: "admin" as const,
          }
        : user.kind === "admin-member"
          ? {
              kind: "admin-member" as const,
              accountId: user.accountId,
              id: user.id,
              role: "ADMIN" as const,
              readAccess: user.readAccess,
              writeAccess: user.writeAccess,
            }
          : user;

    return NextResponse.json(
      { isLoggedIn: true, user: responseUser },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Auth status error:", error);
    return NextResponse.json(
      { isLoggedIn: false, user: null },
      { status: 200 }
    );
  }
}
