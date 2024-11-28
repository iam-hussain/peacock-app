import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { resetAllTransactionMiddlewareHandler } from "@/logic/middleware";

export async function GET() {
  try {
    await resetAllTransactionMiddlewareHandler();

    revalidatePath("/member");
    revalidatePath("/vendor");
    revalidatePath("/loan");
    revalidatePath("/transaction");
    revalidatePath("/dashboard");

    // Return the file path
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
