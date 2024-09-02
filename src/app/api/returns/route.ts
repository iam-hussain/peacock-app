import { calculateReturnsHandler } from "@/passbook/returns-middleware";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Fetch all data from Prisma models

    const returnData = await calculateReturnsHandler();
    // Return the file path
    return NextResponse.json({ success: true, returnData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
