import { NextResponse } from "next/server";

import prisma from "@/db";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    // Check if the transaction exists
    const transaction = await prisma.vendorTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "Vendor transaction not found." },
        { status: 404 },
      );
    }

    // Delete the transaction
    await prisma.vendorTransaction.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Vendor transaction deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting vendor transaction:", error);
    return NextResponse.json(
      { message: "Failed to delete vendor transaction." },
      { status: 500 },
    );
  }
}
