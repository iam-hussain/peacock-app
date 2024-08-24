import prisma from "@/db";
import { NextResponse } from "next/server";

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
      from: true,
      to: true,
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
    transactions,
    total: totalTransactions,
    totalPages: Math.ceil(totalTransactions / limit),
  });
}
