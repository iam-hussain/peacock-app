import { serialize } from "cookie"; // To set cookies
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Set the token in a cookie
  const cookie = serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 3600,
    path: "/",
  });

  const response = NextResponse.json({ message: "Logout successful" });
  response.headers.set("Set-Cookie", cookie);
  return response;
}
