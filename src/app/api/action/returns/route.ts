import { NextResponse } from "next/server";

import { updateAllLoanInterest } from "@/passbook/interest-handler";
import { calculateReturnsHandler } from "@/passbook/returns-handler";

export async function GET() {
  try {
    // Fetch all data from Prisma models

    const loans = await updateAllLoanInterest();
    const returns = await calculateReturnsHandler();

    // Return the file path
    return NextResponse.json({ success: true, data: { returns, loans } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
