import { $Enums, Transaction, VENDOR_TYPE } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";

type TransactionToTransform = Transaction & {
  vendor: VendorDetails;
  member: MemberDetails;
};

type VendorDetails = {
  id: string;
  name: string;
  active: boolean;
  type: $Enums.VENDOR_TYPE;
  owner: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  } | null;
};

type MemberDetails = {
  id: string;
  firstName: string;
  lastName: string | null;
  avatar: string | null;
  active: boolean;
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

const clubData = { name: "Peacock Club", avatar: "/peacock_cash.png" };

function getQueryParams(url: string) {
  const { searchParams } = new URL(url);
  return {
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "10"),
    memberId: searchParams.get("memberId"),
    vendorId: searchParams.get("vendorId"),
    transactionType: searchParams.get("transactionType"),
    startDate: searchParams.get("startDate"),
    endDate: searchParams.get("endDate"),
    sortField: searchParams.get("sortField") || "transactionAt",
    sortOrder: searchParams.get("sortOrder") || "desc",
  };
}

function createFilters({
  memberId,
  vendorId,
  transactionType,
  startDate,
  endDate,
}: any) {
  const filters: Record<string, any> = {};
  if (memberId) filters.memberId = memberId;
  if (vendorId) filters.vendorId = vendorId;
  if (transactionType) filters.transactionType = transactionType;
  if (startDate && endDate)
    filters.transactionAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
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
      vendor: {
        select: {
          id: true,
          name: true,
          active: true,
          type: true,
          owner: {
            select: { id: true, avatar: true, firstName: true, lastName: true },
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
}

async function getTotalTransactions(filters: any) {
  return await prisma.transaction.count({ where: filters });
}

function transactionTableTransform(transaction: TransactionToTransform) {
  const { vendor, member } = transaction;
  const transformed = createTransformedTransaction(vendor, member, transaction);
  return applySpecialCases(transformed, vendor, transaction);
}

function createTransformedTransaction(
  vendor: VendorDetails,
  member: MemberDetails,
  transaction: TransactionToTransform
) {
  return {
    from: {
      id: member.id,
      name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
      active: member.active,
      sub: "",
      avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    },
    to: {
      id: vendor.id,
      name: vendor.name,
      active: vendor.active,
      sub: vendor.owner
        ? `${vendor.owner.firstName} ${vendor.owner.lastName || ""}`
        : "",
      avatar: vendor.owner?.avatar
        ? `/image/${vendor.owner.avatar}`
        : undefined,
    },
    transactionType: transaction.transactionType,
    transactionAt: transaction.transactionAt,
    amount: transaction.amount,
    method: transaction.method,
    note: transaction.note,
    updatedAt: transaction.updatedAt,
    createdAt: transaction.createdAt,
    id: transaction.id,
    fromId: transaction.vendorId,
    toId: transaction.memberId,
    vendorType: "DEFAULT",
    original: {
      vendorId: transaction.vendorId,
      vendorMemberId: vendor.owner?.id || null,
      memberId: transaction.memberId,
    },
  };
}

function applySpecialCases(
  transformed: ReturnType<typeof createTransformedTransaction>,
  vendor: VendorDetails,
  transaction: Transaction
) {
  const { transactionType } = transaction;
  if (vendor.type === "HOLD") {
    Object.assign(transformed.to, clubData);
  }
  if (
    ["FUNDS_TRANSFER", "RETURNS", "PROFIT", "INVEST"].includes(transactionType)
  ) {
    Object.assign(transformed.from, clubData, { sub: transformed.from.name });
  }
  if (
    [
      "PERIODIC_DEPOSIT",
      "OFFSET_DEPOSIT",
      "WITHDRAW",
      "REJOIN",
      "FUNDS_TRANSFER",
    ].includes(transactionType) &&
    vendor.owner?.id
  ) {
    transformed.fromId = transaction.memberId;
    transformed.toId = vendor.owner.id;
  }
  if (["WITHDRAW", "RETURNS", "PROFIT", "INVEST"].includes(transactionType)) {
    [transformed.from, transformed.to] = [transformed.to, transformed.from];
  }
  if (vendor.type === "LEND" && vendor.owner?.id) {
    transformed.fromId = vendor.owner.id;
    transformed.toId = transaction.memberId;
  }
  if (vendor.type === "LEND") {
    transformed.vendorType = "LEND";
  }
  return transformed;
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
      vendorType,
    } = await request.json();
    const { vendorId, memberId } = await determineVendorAndMemberIds({
      fromId,
      toId,
      transactionType,
      vendorType,
    });

    const transaction = await createTransaction({
      vendorId,
      memberId,
      amount,
      transactionType,
      method,
      note,
      transactionAt,
      createdAt,
    });
    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error) {
    console.error("Failed to create transaction", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

async function determineVendorAndMemberIds({
  fromId,
  toId,
  transactionType,
  vendorType,
}: any) {
  let vendorId = fromId;
  let memberId = toId;

  if (
    ["PERIODIC_DEPOSIT", "OFFSET_DEPOSIT", "WITHDRAW", "REJOIN"].includes(
      transactionType
    ) ||
    transactionType === "FUNDS_TRANSFER"
  ) {
    memberId = fromId;
    vendorId = await findOrCreateVendor(toId, "HOLD");
  }

  if (vendorType === "LEND") {
    memberId = toId;
    vendorId = await findOrCreateVendor(fromId, "LEND");
  }

  if (
    vendorType !== "LEND" &&
    ["INVEST", "RETURNS", "PROFIT"].includes(transactionType)
  ) {
    memberId = toId;
    const vendor = await prisma.vendor.findFirst({
      where: { ownerId: fromId, type: "HOLD" },
      select: { id: true },
    });
    if (!vendor) throw new Error("Missing required fields");
    vendorId = vendor.id;
  }

  return { vendorId, memberId };
}

async function findOrCreateVendor(ownerId: string, type: VENDOR_TYPE) {
  const existingVendor = await prisma.vendor.findFirst({
    where: { ownerId, type },
    select: { id: true },
  });
  if (existingVendor) return existingVendor.id;

  const passbookConnection: any =
    type === "LEND"
      ? { create: { type: "VENDOR" } }
      : { connect: { id: await getPassbookId(ownerId) } };
  const newVendor = await prisma.vendor.create({
    data: {
      owner: { connect: { id: ownerId } },
      name: ownerId,
      slug: `${ownerId}-${type}`,
      passbook: passbookConnection,
      type,
    },
  });
  return newVendor.id;
}

async function getPassbookId(memberId: string) {
  const memberData = await prisma.member.findFirstOrThrow({
    where: { id: memberId },
    select: { passbookId: true },
  });
  return memberData.passbookId;
}

async function createTransaction({
  vendorId,
  memberId,
  amount,
  transactionType,
  method,
  note,
  transactionAt,
  createdAt,
}: Transaction | any) {
  return await prisma.transaction.create({
    data: {
      vendorId,
      memberId,
      amount: amount,
      transactionType,
      method: method || "ACCOUNT",
      note: note ?? undefined,
      transactionAt: new Date(transactionAt || new Date()),
      createdAt: createdAt || undefined,
    },
  });
}

export type TransformedTransaction = ReturnType<
  typeof transactionTableTransform
>;
