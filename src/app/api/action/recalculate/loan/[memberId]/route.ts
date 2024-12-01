import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { clearCache } from "@/lib/cache";
import { bulkPassbookUpdate } from "@/lib/helper";
import { recalculateMemberLoanById } from "@/logic/loan-middleware";

export async function POST(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  const { memberId } = params;

  try {
    clearCache();
    // Delete the transaction
    const passbooks = await recalculateMemberLoanById(memberId);
    const updated = await bulkPassbookUpdate(passbooks);
    revalidatePath("*");
    return NextResponse.json(
      { message: "Member loan updated successfully.", updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating member loan:", error);
    return NextResponse.json(
      { message: "Failed to update member loan." },
      { status: 500 }
    );
  }
}
