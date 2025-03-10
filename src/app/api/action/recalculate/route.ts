import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { resetAllTransactionMiddlewareHandler } from "@/logic/middleware";

export async function POST() {
  try {
    await resetAllTransactionMiddlewareHandler();

    revalidateTag("api");
    revalidatePath("*");
    // Return the file path
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
