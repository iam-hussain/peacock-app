import { calculateReturnsHandler } from "@/passbook/returns-handler";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Fetch all data from Prisma models

    calculateReturnsHandler();
    // Return the file path
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
