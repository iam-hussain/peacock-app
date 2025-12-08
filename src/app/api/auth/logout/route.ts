export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();
  return new NextResponse(null, { status: 204 });
}
