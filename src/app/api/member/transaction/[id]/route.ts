import { NextResponse } from "next/server";

import prisma from "@/db";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Check if the transaction exists
    const transaction = await prisma.memberTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "Member transaction not found." },
        { status: 404 }
      );
    }

    // Delete the transaction
    await prisma.memberTransaction.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Member transaction deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting member transaction:", error);
    return NextResponse.json(
      { message: "Failed to delete member transaction." },
      { status: 500 }
    );
  }
}
