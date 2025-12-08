import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000/",
  "https://peacock-club.vercel.app",
];
const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Route protection for /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const sessionCookie = request.cookies.get("pc_auth")?.value;

    if (!sessionCookie) {
      // Redirect to home page if no session
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Verify JWT token
    try {
      const { jwtVerify } = await import("jose");
      const JWT_SECRET = new TextEncoder().encode(
        process.env.JWT_SECRET || "default-secret-change-in-production"
      );

      await jwtVerify(sessionCookie, JWT_SECRET);
    } catch {
      // Invalid or expired token - redirect to home
      const url = request.nextUrl.clone();
      url.pathname = "/";
      // Clear invalid cookie
      const response = NextResponse.redirect(url);
      response.cookies.set("pc_auth", "", {
        maxAge: 0,
        path: "/",
      });
      return response;
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
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
