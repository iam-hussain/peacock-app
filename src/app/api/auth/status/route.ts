export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// File: app/api/auth/status/route.ts

import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ isLoggedIn: false }, { status: 200 });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET!);
    return NextResponse.json(
      { isLoggedIn: true, user: decoded },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ isLoggedIn: false }, { status: 200 });
  }
}
