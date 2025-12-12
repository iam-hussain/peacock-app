export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth";
import { resetAllTransactionMiddlewareHandler } from "@/logic/reset-handler";

export async function POST() {
  try {
    // Only super admin can recalculate returns
    await requireSuperAdmin();

    await resetAllTransactionMiddlewareHandler();

    revalidateTag("api");
    revalidatePath("*");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    // Handle authorization errors
    if (error?.message === "FORBIDDEN_SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Super admin access required" },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
