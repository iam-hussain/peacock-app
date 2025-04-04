export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { serialize } from "cookie"; // To set cookies
import { sign } from "jsonwebtoken"; // For generating JWTs
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { newZoneDate } from "@/lib/date";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }
  if (process.env.PASSWORD !== password) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Generate JWT token (you can also use next-auth or other libraries)
  const token = sign(
    { time: newZoneDate().toDateString() },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  // Set the token in a cookie
  const cookie = serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 3600,
    path: "/",
  });

  revalidatePath("*");
  revalidateTag("api");

  const response = NextResponse.json({ message: "Login successful" });
  response.headers.set("Set-Cookie", cookie);
  return response;
}
