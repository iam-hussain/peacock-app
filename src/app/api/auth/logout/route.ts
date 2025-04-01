export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { serialize } from "cookie"; // To set cookies
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  // Set the token in a cookie
  const cookie = serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 3600,
    path: "/",
  });

  revalidatePath("*");
  revalidateTag("api");

  const response = NextResponse.json({ message: "Logout successful" });
  response.headers.set("Set-Cookie", cookie);
  return response;
}
