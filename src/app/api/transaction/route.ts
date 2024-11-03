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
  const transformed = createTransformedTransaction(
    transaction.member,
    transaction.vendor,
    transaction
  );
  const { from, to } = determineFromAndTo(
    transformed.member,
    transformed.vendor,
    transformed
  );
  return {
    ...transformed,
    from,
    to,
    fromId: from.id as string,
    toId: to.id as string,
  };
}

function determineFromAndTo(
  member: ReturnType<typeof createTransformedTransaction>["member"],
  vendor: ReturnType<typeof createTransformedTransaction>["vendor"],
  transaction: ReturnType<typeof createTransformedTransaction>
) {
  let from:
    | ReturnType<typeof createTransformedTransaction>["member"]
    | ReturnType<typeof createTransformedTransaction>["vendor"];
  let to:
    | ReturnType<typeof createTransformedTransaction>["member"]
    | ReturnType<typeof createTransformedTransaction>["vendor"];

  const memberToVendorTypes = [
    "PERIODIC_DEPOSIT",
    "OFFSET_DEPOSIT",
    "REJOIN",
    "FUNDS_TRANSFER",
  ];
  const vendorToMemberTypes = ["WITHDRAW"];

  // Reverse mapping logic based on transaction type and vendor type
  if (memberToVendorTypes.includes(transaction.transactionType)) {
    // Transactions where the member is sending to the vendor
    from = member;
    to = vendor;
  } else if (vendorToMemberTypes.includes(transaction.transactionType)) {
    // Transactions where the vendor is sending to the member
    from = vendor;
    to = member;
  } else if (transaction.transactionType === "INVEST") {
    // INVEST - member to vendor
    from = member;
    to = vendor;
  } else if (["RETURNS", "PROFIT"].includes(transaction.transactionType)) {
    // RETURNS/PROFIT - vendor to member
    from = vendor;
    to = member;
  }

  return {
    from,
    to,
  };
}

const clubData = { sub: "Peacock Club", avatar: "/peacock_cash.png" };
const loanData = { sub: "Loan Account" };

function createTransformedTransaction(
  member: MemberDetails,
  vendor: VendorDetails,
  transaction: TransactionToTransform
) {
  const vendorOwnerData = vendor.owner
    ? {
        id: vendor.owner.id || vendor.id,
        name: `${vendor.owner.firstName || ""} ${vendor.owner.lastName || ""}`,
        avatar: vendor.owner.avatar
          ? `/image/${vendor.owner.avatar}`
          : undefined,
      }
    : {};

  // Base data structures for member and vendor with default values
  let memberData: any = {};
  let vendorData: any = {};

  const isLendType = vendor.type === "LEND";

  // Set memberData and vendorData based on transaction type
  switch (transaction.transactionType) {
    case "FUNDS_TRANSFER":
      memberData = clubData;
      vendorData = { ...vendorOwnerData, ...clubData };
      break;

    case "PERIODIC_DEPOSIT":
    case "OFFSET_DEPOSIT":
    case "WITHDRAW":
    case "REJOIN":
      if (vendor.owner) {
        vendorData = { ...vendorOwnerData, ...clubData };
      }
      break;

    case "RETURNS":
    case "PROFIT":
      vendorData = isLendType
        ? { ...vendorOwnerData, ...loanData }
        : vendorOwnerData;
      memberData = clubData;
      break;

    case "INVEST":
      memberData = clubData;
      if (isLendType) {
        vendorData = { ...vendorOwnerData, ...loanData };
      }
      break;
  }

  // Construct the final transformed object
  return {
    member: {
      id: member.id,
      name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
      active: member.active,
      sub: "Member",
      avatar: member.avatar ? `/image/${member.avatar}` : undefined,
      ...memberData,
    },
    vendor: {
      id: vendor.id,
      name: vendor.name,
      active: vendor.active,
      sub: "",
      type: vendor.type,
      avatar: undefined,
      ...vendorData,
    },
    memberId: member.id,
    vendorId: vendor.id,
    transactionType: transaction.transactionType,
    transactionAt: transaction.transactionAt,
    amount: transaction.amount,
    method: transaction.method,
    note: transaction.note,
    updatedAt: transaction.updatedAt,
    createdAt: transaction.createdAt,
    id: transaction.id,
    vendorType: isLendType ? "LEND" : "DEFAULT",
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
}: {
  fromId: string;
  toId: string;
  transactionType: string;
  vendorType: string;
}) {
  let vendorId = toId;
  let memberId = fromId;

  // Transaction types that determine vendor and member roles
  const memberToVendorTypes = [
    "PERIODIC_DEPOSIT",
    "OFFSET_DEPOSIT",
    "REJOIN",
    "FUNDS_TRANSFER",
  ];
  const vendorToMemberTypes = ["WITHDRAW"];

  // Check if vendor needs to be created for specific types
  if (vendorType === "LEND" || vendorType === "HOLD") {
    vendorId = await findOrCreateVendor(toId, vendorType);
  }

  if (memberToVendorTypes.includes(transactionType)) {
    memberId = fromId;
    vendorId = await findOrCreateVendor(toId, "HOLD");
  } else if (vendorToMemberTypes.includes(transactionType)) {
    memberId = toId;
    vendorId = await findOrCreateVendor(fromId, "HOLD");
  } else if (["INVEST"].includes(transactionType)) {
    // INVEST from member to vendor
    memberId = fromId;
    vendorId =
      vendorType === "LEND" ? await findOrCreateVendor(fromId, "LEND") : toId;
  } else if (["RETURNS", "PROFIT"].includes(transactionType)) {
    // RETURNS or PROFIT from vendor to member
    vendorId = fromId;
    memberId =
      vendorType === "LEND" ? await findOrCreateVendor(fromId, "LEND") : toId;
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
