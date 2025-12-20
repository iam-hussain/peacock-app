export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/core/auth";
import { clearCache } from "@/lib/core/cache";

/**
 * POST /api/admin/clear-cache
 * Clear all caches (server-side and Next.js caches)
 * Admin-only endpoint
 */
export async function POST() {
  try {
    await requireAdmin();

    // Clear Next.js route cache
    revalidatePath("*");

    // Clear Next.js tag cache
    revalidateTag("api");
    revalidateTag("dashboard");
    revalidateTag("transaction");
    revalidateTag("account");
    revalidateTag("member");
    revalidateTag("vendor");

    // Clear NodeCache (server-side in-memory cache)
    clearCache();

    return NextResponse.json({
      success: true,
      message: "All caches cleared successfully",
    });
  } catch (error: any) {
    console.error("Error clearing cache:", error);
    if (
      error.message === "FORBIDDEN_ADMIN" ||
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}
