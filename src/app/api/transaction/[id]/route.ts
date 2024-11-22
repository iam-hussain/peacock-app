import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import prisma from "@/db";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Check if the transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "Vendor transaction not found." },
        { status: 404 }
      );
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id },
    });

    revalidatePath("/member");
    revalidatePath("/vendor");
    revalidatePath("/loan");
    revalidatePath("/transaction");
    revalidatePath("/dashboard");

    return NextResponse.json(
      { message: "Transaction deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { message: "Failed to delete transaction." },
      { status: 500 }
    );
  }
}
