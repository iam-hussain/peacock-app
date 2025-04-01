export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { clearCache } from "@/lib/cache";

export async function GET() {
  try {
    // Reset cache after an update
    clearCache();
    revalidatePath("*");

    // Return the file path
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
