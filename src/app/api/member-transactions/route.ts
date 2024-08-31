import prisma from "@/db";
import { MemberTransaction } from "@prisma/client";
import { NextResponse } from "next/server";

type MemberTransactionToTransform = MemberTransaction & {
  to: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
    active: boolean;
  };
  from: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
    active: boolean;
  };
};

export type MemberTransactionResponse = ReturnType<
  typeof membersTransactionTableTransform
>;

function membersTransactionTableTransform(
  transaction: MemberTransactionToTransform
) {
  const { from, to } = transaction;
  return {
    from: {
      id: from.id,
      name: `${from.firstName}${from.lastName ? ` ${from.lastName}` : ""}`,
      avatar: from.avatar ? `/image/${from.avatar}` : undefined,
      active: from.active,
    },
    to: {
      id: to.id,
      name: `${to.firstName}${to.lastName ? ` ${to.lastName}` : ""}`,
      avatar: to.avatar ? `/image/${to.avatar}` : undefined,
      active: to.active,
    },
    transactionType: transaction.transactionType,
    transactionAt: transaction.transactionAt,
    amount: transaction.amount,
    method: transaction.method,
    note: transaction.note,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    id: transaction.id,
    fromId: transaction.fromId,
    toId: transaction.toId,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const fromId = searchParams.get("fromId");
  const toId = searchParams.get("toId");
  const transactionType = searchParams.get("transactionType");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const sortField = searchParams.get("sortField") || "transactionAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const filters: any = {};

  if (fromId) filters.fromId = fromId;
  if (toId) filters.toId = toId;
  if (transactionType) filters.transactionType = transactionType;
  if (startDate && endDate) {
    filters.transactionAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const transactions = await prisma.memberTransaction.findMany({
    where: filters,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      [sortField]: sortOrder,
    },
    include: {
      from: {
        select: {
          id: true,
          avatar: true,
          firstName: true,
          lastName: true,
          active: true,
        },
      },
      to: {
        select: {
          id: true,
          avatar: true,
          firstName: true,
          lastName: true,
          active: true,
        },
      },
    },
  });

  const totalTransactions = await prisma.memberTransaction.count({
    where: filters,
  });

  return NextResponse.json({
    transactions: transactions.map(membersTransactionTableTransform),
    total: totalTransactions,
    totalPages: Math.ceil(totalTransactions / limit),
  });
}

// POST route for adding a member transaction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      createdAt,
      transactionAt,
      fromId,
      toId,
      amount,
      transactionType,
      method,
      note,
    } = body;

    // Validate the request body
    if (!fromId || !toId || !amount || !transactionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the new transaction
    const transaction = await prisma.memberTransaction.create({
      data: {
        fromId,
        toId,
        amount: parseFloat(amount),
        transactionType,
        method: method || "ACCOUNT",
        note: note || "",
        transactionAt: new Date(transactionAt || new Date()),
        createdAt: createdAt || undefined,
      },
    });

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

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
        { message: "Transaction not found." },
        { status: 404 }
      );
    }

    // Delete the transaction
    await prisma.memberTransaction.delete({
      where: { id },
    });

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
