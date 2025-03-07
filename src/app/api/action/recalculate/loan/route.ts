import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { resetAllLoanHandler } from "@/logic/middleware";

export async function POST() {
  try {
    await resetAllLoanHandler();

    revalidateTag("api");
    revalidatePath("*");
    // Return the file path
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
