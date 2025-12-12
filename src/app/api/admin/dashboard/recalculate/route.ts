export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { handleAuthError } from "@/lib/error-handler";
import { resetAllTransactionMiddlewareHandler } from "@/logic/reset-handler";

/**
 * POST /api/admin/dashboard/recalculate
 * Recalculate all monthly dashboard snapshots
 * Admin-only endpoint
 */
export async function POST(request: NextRequest) {
    try {
        const user = await requireAdmin();
        const adminId = user.kind === "admin-member" ? user.accountId : null;

        // Optional: Check for force flag in body
        const body = await request.json().catch(() => ({}));
        const _force = body.force === true;

        if (adminId !== null) {
            // Recalculate all snapshots
            // This is a long-running operation, so we'll let it complete
            await resetAllTransactionMiddlewareHandler(false, true);
        }
        return NextResponse.json({
            success: true,
            message: "Dashboard data recalculated successfully",
        });
    } catch (error: any) {
        if (
            error.message === "FORBIDDEN_ADMIN" ||
            error.message === "UNAUTHORIZED"
        ) {
            return handleAuthError(error);
        }

        console.error("Error recalculating dashboard:", error);

        // Return proper error response
        const errorMessage =
            error?.message || "Failed to recalculate dashboard data";
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}
