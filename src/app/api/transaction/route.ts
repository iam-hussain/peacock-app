import { Transaction } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { newZoneDate } from "@/lib/date";

type TransactionToTransform = Transaction & {
  from: AccountDetails;
  to: AccountDetails;
};

type AccountDetails = {
  id: string;
  firstName: string;
  lastName: string | null;
  avatar: string | null;
  active: boolean;
  isMember: boolean;
};

export async function GET(request: Request) {
  const queryParams = getQueryParams(request.url);
  const filters = createFilters(queryParams);

  try {
    const transactions = await fetchTransactions(
      filters,
      queryParams.page,
      queryParams.limit,
      queryParams.sortField,
      queryParams.sortOrder
    );
    const totalTransactions = await getTotalTransactions(filters);

    return NextResponse.json({
      transactions: transactions.map(transactionTableTransform),
      total: totalTransactions,
      page: queryParams.page,
      totalPages: Math.ceil(totalTransactions / queryParams.limit),
    });
  } catch (error) {
    console.error("Error fetching vendor transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor transactions" },
      { status: 500 }
    );
  }
}

function getQueryParams(url: string) {
  const { searchParams } = new URL(url);
  return {
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "10"),
    accountId: searchParams.get("accountId"),
    transactionType: searchParams.get("transactionType"),
    startDate: searchParams.get("startDate"),
    endDate: searchParams.get("endDate"),
    sortField: searchParams.get("sortField") || "transactionAt",
    sortOrder: searchParams.get("sortOrder") || "desc",
  };
}

function createFilters({
  accountId,
  transactionType,
  startDate,
  endDate,
  sortField,
}: any) {
  const filters: Record<string, any> = {};
  if (accountId && (!transactionType || transactionType === "FUNDS_TRANSFER")) {
    filters.OR = [
      {
        fromId: accountId,
      },
      {
        toId: accountId,
      },
    ];
  }
  if (transactionType) {
    filters.transactionType = transactionType;
    if (accountId && transactionType !== "FUNDS_TRANSFER") {
      if (
        [
          "PERIODIC_DEPOSIT",
          "OFFSET_DEPOSIT",
          "REJOIN",
          "VENDOR_RETURNS",
          "LOAN_REPAY",
          "LOAN_INTEREST",
        ].includes(transactionType)
      ) {
        filters.fromId = accountId;
      }

      if (
        ["WITHDRAW", "VENDOR_INVEST", "LOAN_TAKEN"].includes(transactionType)
      ) {
        filters.toId = accountId;
      }
    }
  }

  if (startDate && endDate)
    if (
      sortField &&
      (sortField === "transactionAt" || sortField === "createdAt")
    ) {
      filters[sortField] = {
        gte: newZoneDate(startDate),
        lte: newZoneDate(endDate),
      };
    } else {
      filters.createdAt = {
        gte: newZoneDate(startDate),
        lte: newZoneDate(endDate),
      };
    }
  return filters;
}

async function fetchTransactions(
  filters: any,
  page: number,
  limit: number,
  sortField: string,
  sortOrder: string
) {
  return await prisma.transaction.findMany({
    where: filters,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortField]: sortOrder },
    include: {
      from: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          active: true,
          isMember: true,
        },
      },
      to: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          active: true,
          isMember: true,
        },
      },
    },
  });
}

async function getTotalTransactions(filters: any) {
  return await prisma.transaction.count({ where: filters });
}
const clubData = { sub: "Peacock Club", avatar: "/peacock_cash.png" };

function transactionTableTransform(transaction: TransactionToTransform) {
  const fromName = `${transaction.from.firstName || ""} ${transaction.from.lastName || ""}`;
  const toName = `${transaction.to.firstName || ""} ${transaction.to.lastName || ""}`;

  const updated = {
    from: {
      ...transaction.from,
      name: fromName,
      sub: "",
      avatar: transaction.from.avatar
        ? `/image/${transaction.from.avatar}`
        : undefined,
    },
    to: {
      ...transaction.to,
      name: toName,
      sub: "",
      avatar: transaction.to.avatar
        ? `/image/${transaction.to.avatar}`
        : undefined,
    },
  };

  if (["LOAN_TAKEN"].includes(transaction.transactionType)) {
    updated.to.sub = "Loan Account";
  }

  if (["LOAN_REPAY", "LOAN_INTEREST"].includes(transaction.transactionType)) {
    updated.from.sub = "Loan Account";
    updated.to.sub = "Club Account";
  }

  if (
    ["WITHDRAW", "LOAN_TAKEN", "VENDOR_INVEST", "FUNDS_TRANSFER"].includes(
      transaction.transactionType
    )
  ) {
    updated.from.sub = "Club Account";
    updated.from.avatar = clubData.avatar;
  }

  if (
    [
      "PERIODIC_DEPOSIT",
      "VENDOR_RETURNS",
      "OFFSET_DEPOSIT",
      "LOAN_REPAY",
      "LOAN_INTEREST",
      "FUNDS_TRANSFER",
    ].includes(transaction.transactionType)
  ) {
    updated.to.sub = clubData.sub;
    updated.to.avatar = clubData.avatar;
  }

  return {
    ...transaction,
    ...updated,
  };
}

export type GetTransactionResponse = {
  transactions: TransformedTransaction[];
  total: number;
  page: number;
  totalPages: number;
};

export async function POST(request: Request) {
  try {
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

    const transaction = await createTransaction({
      fromId,
      toId,
      amount,
      transactionType,
      method,
      note,
      transactionAt,
      createdAt,
    });

    revalidatePath("*");
    revalidateTag("api");
    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error) {
    console.error("Failed to create transaction", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

async function createTransaction({
  fromId,
  toId,
  amount,
  transactionType,
  method,
  note,
  transactionAt,
  createdAt,
}: Transaction | any) {
  return await prisma.transaction.create({
    data: {
      fromId,
      toId,
      amount: amount,
      transactionType,
      method: method || "ACCOUNT",
      note: note ?? undefined,
      transactionAt: newZoneDate(transactionAt || undefined),
      createdAt: createdAt || undefined,
    },
  });
}

export type TransformedTransaction = ReturnType<
  typeof transactionTableTransform
>;
