import { VendorTransaction } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";

type VendorTransactionToTransform = VendorTransaction & {
  vendor: {
    id: string;
    name: string;
    active: boolean;
    owner: {
      id: string;
      firstName: string;
      lastName: string | null;
      avatar: string | null;
    } | null;
  };
  member: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
    active: boolean;
  };
};

// GET: Fetch vendor transactions with pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const memberId = searchParams.get("memberId");
  const vendorId = searchParams.get("vendorId");
  const transactionType = searchParams.get("transactionType");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const sortField = searchParams.get("sortField") || "transactionAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const filters: any = {};

  if (memberId) filters.memberId = memberId;
  if (vendorId) filters.vendorId = vendorId;
  if (transactionType) filters.transactionType = transactionType;
  if (startDate && endDate) {
    filters.transactionAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  try {
    const transactions = await prisma.vendorTransaction.findMany({
      where: filters,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortField]: sortOrder,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            active: true,
            owner: {
              select: {
                id: true,
                avatar: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        member: {
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

    const totalTransactions = await prisma.vendorTransaction.count();

    return NextResponse.json({
      transactions: transactions.map(vendorsTransactionTableTransform),
      total: totalTransactions,
      page,
      totalPages: Math.ceil(totalTransactions / limit),
    });
  } catch (error) {
    console.error("Error fetching vendor transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor transactions" },
      { status: 500 }
    );
  }
}

function vendorsTransactionTableTransform(
  transaction: VendorTransactionToTransform
) {
  const { vendor, member } = transaction;
  const memberName = vendor?.owner?.firstName
    ? `${vendor.owner.firstName} ${vendor.owner.lastName || ""}`
    : "";

  return {
    vendor: {
      id: vendor.id,
      name: vendor.name,
      active: vendor.active,
      memberName,
      memberAvatar: vendor?.owner?.avatar
        ? `/image/${vendor.owner.avatar}`
        : undefined,
    },
    member: {
      id: member.id,
      name: `${member.firstName}${
        member.lastName ? ` ${member.lastName}` : ""
      }`,
      avatar: member.avatar ? `/image/${member.avatar}` : undefined,
      active: member.active,
    },
    transactionType: transaction.transactionType,
    transactionAt: transaction.transactionAt,
    amount: transaction.amount,
    method: transaction.method,
    note: transaction.note,
    updatedAt: transaction.updatedAt,
    createdAt: transaction.createdAt,
    id: transaction.id,
    vendorId: transaction.vendorId,
    memberId: transaction.memberId,
  };
}

export type GetVendorTransactionResponse = {
  transactions: TransformedVendorTransaction[];
  total: number;
  page: number;
  totalPages: number;
};

export async function POST(request: Request) {
  try {
    const {
      createdAt,
      transactionAt,
      vendorId,
      memberId,
      amount,
      transactionType,
      method,
      note,
    } = await request.json();

    // Validate required fields
    if (!vendorId || !memberId || !amount || !transactionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a vendor transaction
    const vendorTransaction = await prisma.vendorTransaction.create({
      data: {
        vendorId,
        memberId,
        amount: parseFloat(amount),
        transactionType,
        method: method || "ACCOUNT",
        note: note ?? undefined,
        transactionAt: new Date(transactionAt || new Date()),
        createdAt: createdAt || undefined,
      },
    });

    return NextResponse.json(
      { success: true, vendorTransaction },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create transaction", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

export type TransformedVendorTransaction = ReturnType<
  typeof vendorsTransactionTableTransform
>;
