import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { resetAllTransactionMiddlewareHandler } from "@/logic/middleware";

export async function GET() {
  try {
    // Fetch all data from Prisma models
    // let passbookToUpdate = await connectionMiddleware();
    // passbookToUpdate = await updateAllLoanMiddleware(passbookToUpdate);

    // await bulkPassbookUpdate(passbookToUpdate);

    const passbookToUpdate = await resetAllTransactionMiddlewareHandler();

    revalidatePath("/member");
    revalidatePath("/vendor");
    revalidatePath("/loan");
    revalidatePath("/transaction");
    revalidatePath("/dashboard");

    // Return the file path
    return NextResponse.json({ success: true, data: passbookToUpdate });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
