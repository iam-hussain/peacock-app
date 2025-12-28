export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Transaction } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { clubData } from "@/lib/config/config";
import { newZoneDate } from "@/lib/core/date";

type AccountDetails = {
  id: string;
  username: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED" | "CLOSED";
  type: "MEMBER" | "VENDOR" | "CLUB" | "SYSTEM";
};

type AuditAccountDetails = {
  id: string;
  firstName: string;
  lastName: string | null;
};

type TransactionToTransform = Transaction & {
  from: AccountDetails;
  to: AccountDetails;
  createdBy: AuditAccountDetails | null;
  updatedBy: AuditAccountDetails | null;
};

/**
 * @swagger
 * /api/transaction:
 *   post:
 *     summary: Get transactions list
 *     description: Retrieves a paginated list of transactions with filtering and sorting options. Requires authentication.
 *     tags: [Transaction]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of transactions per page
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter by account ID (from or to)
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [DEPOSIT, WITHDRAWAL, LOAN, LOAN_REPAYMENT, INTEREST, FEE, TRANSFER, LOAN_ALL]
 *         description: Filter by transaction type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           default: occurredAt
 *           enum: [occurredAt, createdAt, amount]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       fromId:
 *                         type: string
 *                       toId:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       type:
 *                         type: string
 *                       occurredAt:
 *                         type: string
 *                         format: date-time
 *                       from:
 *                         type: object
 *                         description: Source account details
 *                       to:
 *                         type: object
 *                         description: Destination account details
 *                 total:
 *                   type: integer
 *                   description: Total number of transactions
 *                 page:
 *                   type: integer
 *                   description: Current page number
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export async function POST(request: Request) {
  try {
    const { requireAuth } = await import("@/lib/core/auth");
    await requireAuth();

    const queryParams = getQueryParams(request.url);
    const filters = createFilters(queryParams);

    const transactions = await fetchTransactions(
      filters,
      queryParams.page,
      queryParams.limit,
      queryParams.sortField,
      queryParams.sortOrder
    );
    const totalTransactions = await prisma.transaction.count({
      where: filters,
    });

    return NextResponse.json({
      transactions: transactions.map(transactionTableTransform),
      total: totalTransactions,
      page: queryParams.page,
      totalPages: Math.ceil(totalTransactions / queryParams.limit),
    });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
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
    sortField: searchParams.get("sortField") || "occurredAt",
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
    filters.OR = [{ fromId: accountId }, { toId: accountId }];
  }
  if (transactionType) {
    const mapMultiType = (value: string) => {
      if (value === "LOAN_ALL") {
        return ["LOAN_TAKEN", "LOAN_REPAY", "LOAN_INTEREST"];
      }
      if (value.includes(",")) {
        return value
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      }
      return value;
    };
    const mappedType = mapMultiType(transactionType);
    filters.type =
      Array.isArray(mappedType) && mappedType.length > 0
        ? { in: mappedType }
        : mappedType;
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
      (sortField === "occurredAt" || sortField === "createdAt")
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

function fetchTransactions(
  filters: any,
  page: number,
  limit: number,
  sortField: string,
  sortOrder: string
) {
  return prisma.transaction.findMany({
    where: filters,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortField]: sortOrder },
    include: {
      from: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          status: true,
          type: true,
        },
      },
      to: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          status: true,
          type: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

function transactionTableTransform(transaction: TransactionToTransform) {
  const fromName = `${transaction.from.firstName || ""} ${transaction.from.lastName || ""}`;
  const toName = `${transaction.to.firstName || ""} ${transaction.to.lastName || ""}`;

  const updated = {
    from: {
      ...transaction.from,
      name: fromName,
      sub: "",
      avatar: transaction.from.avatarUrl
        ? `/image/${transaction.from.avatarUrl}`
        : undefined,
      link:
        transaction.from.type === "MEMBER"
          ? `/dashboard/member/${transaction.from.username}`
          : undefined,
    },
    to: {
      ...transaction.to,
      name: toName,
      sub: "",
      avatar: transaction.to.avatarUrl
        ? `/image/${transaction.to.avatarUrl}`
        : undefined,
      link:
        transaction.to.type === "MEMBER"
          ? `/dashboard/member/${transaction.to.username}`
          : undefined,
    },
  };

  if (["LOAN_TAKEN"].includes(transaction.type)) {
    updated.to.sub = "Loan Account";
  }

  if (["LOAN_REPAY", "LOAN_INTEREST"].includes(transaction.type)) {
    updated.from.sub = "Loan Account";
    updated.to.sub = "Club Account";
  }

  if (
    ["WITHDRAW", "LOAN_TAKEN", "VENDOR_INVEST", "FUNDS_TRANSFER"].includes(
      transaction.type
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
    ].includes(transaction.type)
  ) {
    updated.to.sub = clubData.sub;
    updated.to.avatar = clubData.avatar;
  }

  const createdByName = transaction.createdBy
    ? `${transaction.createdBy.firstName} ${transaction.createdBy.lastName || ""}`.trim()
    : null;
  const updatedByName = transaction.updatedBy
    ? `${transaction.updatedBy.firstName} ${transaction.updatedBy.lastName || ""}`.trim()
    : null;

  return {
    ...transaction,
    ...updated,
    transactionType: transaction.type,
    createdByName,
    updatedByName,
    createdById: transaction.createdById,
    updatedById: transaction.updatedById,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

export type GetTransactionResponse = {
  transactions: TransformedTransaction[];
  total: number;
  page: number;
  totalPages: number;
};

export type TransformedTransaction = ReturnType<
  typeof transactionTableTransform
>;
