import { NextResponse } from "next/server";

import { bulkPassbookUpdate } from "@/lib/helper";
import { connectionMiddleware } from "@/logic/connection-middleware";
import { updateAllLoanMiddleware } from "@/logic/loan-middleware";

export async function GET() {
  try {
    // Fetch all data from Prisma models
    let passbookToUpdate = await connectionMiddleware();
    passbookToUpdate = await updateAllLoanMiddleware(passbookToUpdate);

    await bulkPassbookUpdate(passbookToUpdate);

    // Return the file path
    return NextResponse.json({ success: true, data: passbookToUpdate });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
