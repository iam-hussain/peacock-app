import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Performance and security middleware
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add performance headers for all routes
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Add compression hint for API routes (actual compression handled by Next.js)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Compression is handled by Next.js config, but we can add hints
    response.headers.set("Vary", "Accept-Encoding");
  }

  // Add cache headers for static assets
  if (
    request.nextUrl.pathname.match(
      /\.(jpg|jpeg|png|gif|svg|ico|webp|avif|woff|woff2|ttf|eot)$/
    )
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
  }

  return response;
}

// Run middleware on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
