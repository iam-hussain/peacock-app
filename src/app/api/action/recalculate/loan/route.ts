export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { resetAllLoanHandler } from "@/logic/reset-handler";

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
