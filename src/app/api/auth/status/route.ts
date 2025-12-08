export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { isLoggedIn: false, user: null },
      { status: 200 }
    );
  }

  // Ensure admin user has username property
  const responseUser =
    user.kind === "admin"
      ? { kind: "admin" as const, username: "admin" as const }
      : user;

  return NextResponse.json(
    { isLoggedIn: true, user: responseUser },
    { status: 200 }
  );
}
