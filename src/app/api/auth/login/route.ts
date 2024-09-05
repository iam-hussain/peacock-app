import { serialize } from "cookie"; // To set cookies
import { sign } from "jsonwebtoken"; // For generating JWTs
import { NextResponse } from "next/server";

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
    { time: new Date().toDateString() },
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

  const response = NextResponse.json({ message: "Login successful" });
  response.headers.set("Set-Cookie", cookie);
  return response;
}
