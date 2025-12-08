export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { requireWriteAccess } from "@/lib/auth";
import { newZoneDate } from "@/lib/date";
import { transactionEntryHandler } from "@/logic/transaction-handler";

export async function POST(request: Request) {
  try {
    const user = await requireWriteAccess();

    const {
      createdAt,
      transactionAt,
      fromId,
      toId,
      amount,
      transactionType,
      method,
      note,
    } = await request.json();

    const transaction = await prisma.transaction.create({
      data: {
        fromId,
        toId,
        amount: amount,
        transactionType,
        method: method || "ACCOUNT",
        note: note ?? undefined,
        transactionAt: newZoneDate(transactionAt || undefined),
        createdAt: createdAt || undefined,
        createdByActor: user.kind === "admin" ? "ADMIN" : "MEMBER",
        createdById: user.kind === "member" ? user.accountId : null,
      },
    });
    if (transaction) await transactionEntryHandler(transaction);

    revalidatePath("*");
    revalidateTag("api");
    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create transaction", error);
    if (
      error.message === "Unauthorized" ||
      error.message.includes("Forbidden")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
