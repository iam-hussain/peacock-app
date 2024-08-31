// File: middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

const allowedOrigins = [
  "http://localhost:3000/",
  "https://peacock-club.vercel.app",
];
const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function verifyJwt(token: string, secretKey: string) {
  const [header, payload, signature] = token.split(".");

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["verify"]
  );

  const data = encoder.encode(`${header}.${payload}`);
  const signatureBytes = Uint8Array.from(
    atob(signature.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, data);

  if (!isValid) {
    throw new Error("Invalid token");
  }

  return JSON.parse(atob(payload));
}

export function middleware(request: NextRequest) {
  // CORS Handling
  const origin = request.headers.get("origin") ?? "";
  const isAllowedOrigin = allowedOrigins.includes(origin);

  const isPreflight = request.method === "OPTIONS";

  if (isPreflight) {
    const preflightHeaders = {
      ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
      ...corsOptions,
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Token Validation for Protected Methods
  if (["POST", "PUT", "DELETE"].includes(request.method)) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "You need to log in to continue this action." },
        { status: 401 }
      );
    }

    try {
      const decoded = verifyJwt(token, process.env.JWT_SECRET!);
      console.log({ decoded });
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        {
          message:
            "Invalid login. Please try logging out and then logging in again.",
        },
        { status: 401 }
      );
    }
  }

  // Handle CORS for simple requests
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    "/api/members/:path*",
    "/api/member-transactions/:path*",
    "/api/statistics/:path*",
    "/api/vendor-profit-share/:path*",
    "/api/vendor-transactions/:path*",
    "/api/vendors/:path*",
    "/api/calc/:path*",
  ], // Apply to all API routes
};
