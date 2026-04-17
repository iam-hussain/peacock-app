export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";

import { computeLiveDashboard } from "@/lib/calculators/dashboard-live";

/**
 * GET /api/dashboard/club-passbook
 * Returns the live dashboard computed from the CLUB passbook. Shares its
 * implementation with /api/dashboard/summary (no-month branch) via
 * `computeLiveDashboard` so the two endpoints can never diverge.
 */
export async function GET(request: NextRequest) {
  try {
    const result = await computeLiveDashboard();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === result.etag) {
      return new NextResponse(null, { status: 304 });
    }

    return NextResponse.json(
      { success: true, data: result.data },
      {
        headers: {
          "Cache-Control": "private, no-cache, must-revalidate",
          ETag: result.etag,
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching club passbook:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch club passbook" },
      { status: 500 }
    );
  }
}
