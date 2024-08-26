import prisma from "@/db";
import {  MemberTransaction } from "@prisma/client";
import { NextResponse } from "next/server";

type MemberTransactionToTransform = MemberTransaction & {
  to: {
    id: string
    firstName: string
    lastName: string | null
    avatar: string | null
    active: boolean
  };
  from:  {
    id: string
    firstName: string
    lastName: string | null
    avatar: string | null
    active: boolean
  };
};

export type MemberTransactionResponse = ReturnType<typeof membersTransactionTableTransform>

export function membersTransactionTableTransform(
  transaction: MemberTransactionToTransform
) {
  const { from, to } = transaction
  return {
    from: {
      id: from.id,
      name: `${from.firstName}${from.lastName ? ` ${from.lastName}` : ""}`,
      avatar: from.avatar
      ? `/image/${from.avatar}`
      : "/image/no_image_available.jpeg",
      active: from.active,
    },
    to: {
      id: to.id,
      name: `${from.firstName}${from.lastName ? ` ${from.lastName}` : ""}`,
      avatar: to.avatar
      ? `/image/${to.avatar}`
      : "/image/no_image_available.jpeg",
      active: to.active,
    },
    transactionType: transaction.transactionType,
    transactionAt: transaction.transactionAt,
    amount: transaction.amount,
    method: transaction.method,
    note: transaction.note,
    createdAt: transaction.createdAt,
    id: transaction.id,
  }
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
    include: {
      from: {
        select: {
          id: true,
          avatar: true,
          firstName: true,
          lastName: true,
          active: true
        }
      },
      to: {    
        select: {
          id: true,
          avatar: true,
          firstName: true,
          lastName: true,
          active: true
        }
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: {
      [sortField]: sortOrder,
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
