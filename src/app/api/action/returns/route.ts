import { NextResponse } from "next/server";

import { calculateReturnsHandler } from "@/passbook/returns-handler";

export async function POST(request: Request) {
  try {
    // Fetch all data from Prisma models

    const returns = await calculateReturnsHandler();
    // Return the file path
    return NextResponse.json({ success: true, returns });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
