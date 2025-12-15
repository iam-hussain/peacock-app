export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { requireWriteAccess } from "@/lib/core/auth";
import { transactionEntryHandler } from "@/logic/transaction-handler";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const _user = await requireWriteAccess();

    // Check if the transaction exists
    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) {
      return NextResponse.json(
        { message: "Transaction not found." },
        { status: 404 }
      );
    }

    // Revert passbook changes before deleting the transaction
    // If this fails, the transaction will be deleted but passbooks will be out of sync
    try {
      if (transaction) {
        await transactionEntryHandler(transaction, true);
      }
    } catch (handlerError: any) {
      console.error(
        `⚠️ Transaction ${id} deletion: passbook revert failed. ` +
          `Transaction will be deleted but passbooks may be out of sync. ` +
          `Run recalculation to fix. Error: ${handlerError.message}`
      );
      // Continue with deletion even if passbook revert failed
      // The transaction will be deleted, but passbooks need recalculation
    }

    // Delete the transaction
    await prisma.transaction.delete({ where: { id } });

    revalidatePath("*");
    return NextResponse.json(
      { message: "Transaction deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    const { handleAuthError } = await import("@/lib/core/error-handler");
    if (
      error.message === "UNAUTHORIZED" ||
      error.message === "FORBIDDEN_WRITE" ||
      error.message === "FORBIDDEN_ADMIN"
    ) {
      return handleAuthError(error);
    }
    return NextResponse.json(
      { message: "Failed to delete transaction." },
      { status: 500 }
    );
  }
}
