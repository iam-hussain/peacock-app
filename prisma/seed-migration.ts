import { PrismaClient } from "@prisma/client";
import seedData from "../public/peacock_backup_old.json" assert { type: "json" };
import { passbookExtends } from "../src/db";
import { calculateReturnsHandler } from "../src/passbook/returns-middleware";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
}).$extends(passbookExtends);

type MapListType = Map<number, string>;
const transactionTypeMap: {
  [key in string]: any;
} = {
  MEMBERS_PERIODIC_DEPOSIT: "PERIODIC_DEPOSIT",
  MEMBERS_WITHDRAW: "WITHDRAW",
  MEMBERS_WITHDRAW_PROFIT: "WITHDRAW",
  MEMBERS_REPAY_PROFIT: "REPAY_PROFIT",
  NEW_MEMBER_PAST_TALLY: "OFFSET_DEPOSIT",
  INTER_CASH_TRANSFER: "FUNDS_TRANSFER",
  VENDOR_PERIODIC_INVEST: "PERIODIC_INVEST",
  VENDOR_PERIODIC_RETURN: "PERIODIC_RETURN",
  VENDOR_INVEST: "INVEST",
  VENDOR_RETURN: "RETURNS",
  OTHER_EXPENDITURE: "EXPENSE",
};

const vendorTypeMap: {
  [key in string]: any;
} = {
  LOAD_BORROWER: "LEND",
  DEFAULT: "BANK",
  CHIT_FUND_COMPANY: "CHIT",
};

function createMembers() {
  return seedData.user
    .filter((e) => e.type == "MEMBER")
    .map(({ createdAt, updatedAt, ...each }) => {
      return prisma.member.create({
        data: {
          firstName: each.firstName,
          lastName: each.lastName,
          avatar: each.avatar,
          email: each.email,
          joinedAt: each.joinedAt,
          username: each.nickName,
          phone: each.mobileNumber,
          active: !each.deleted,
          createdAt,
          updatedAt,
          passbook: {
            create: {
              type: "MEMBER",
            },
          },
        },
      });
    });
}

function createVendors() {
  return seedData.user
    .filter((e) => e.type == "VENDOR")
    .map(({ createdAt, updatedAt, deleted, deletedAt, ...each }) => {
      return prisma.vendor.create({
        data: {
          name: each.firstName,
          slug: each.nickName,
          type: vendorTypeMap[each.vendorType] as any,
          startAt: each.joinedAt,
          active: each.isActive && !deleted,
          createdAt,
          updatedAt,
          passbook: {
            create: {
              type: "VENDOR",
            },
          },
        },
      });
    });
}

function createVendorProfitShare(members: MapListType, vendors: MapListType) {
  return seedData.interLink.map(
    ({ createdAt, updatedAt, vendorId, memberId, includeProfit }) => {
      return prisma.vendorProfitShare.create({
        data: {
          active: includeProfit,
          vendorId: vendors.get(vendorId) as string,
          memberId: members.get(memberId) as string,
          createdAt,
          updatedAt,
        },
      });
    },
  );
}

async function getMemberMap() {
  const memberMap: MapListType = new Map();
  const fetchedUsers = await prisma.member.findMany({
    select: {
      id: true,
      username: true,
      active: true,
    },
  });
  fetchedUsers.forEach((user) => {
    const match = seedData.user.find((le) => le.nickName === user.username);
    if (match) {
      memberMap.set(match.id, user.id);
    }
  });
  return memberMap;
}

async function getVendorMap() {
  const venderMap: MapListType = new Map();
  const fetchedVendor = await prisma.vendor.findMany({
    select: {
      id: true,
      slug: true,
      active: true,
    },
  });
  fetchedVendor.forEach((user) => {
    const match = seedData.user.find((le) => le.nickName === user.slug);
    if (match) {
      venderMap.set(match.id, user.id);
    }
  });
  return venderMap;
}

async function seed() {
  const userTransactions = createMembers();
  const vendorTransactions = createVendors();

  await prisma.$transaction([
    ...userTransactions,
    ...vendorTransactions,
    prisma.passbook.create({
      data: {
        type: "CLUB",
      },
    }),
  ]);

  const members = await getMemberMap();
  const vendors = await getVendorMap();

  const connections = createVendorProfitShare(members, vendors);
  await prisma.$transaction(connections);

  // const transactions = createTransactions(members, vendors);
  // await prisma.$transaction(transactions);

  const transactionList = seedData.transaction.filter((e) => !e.deleted);

  for (const {
    id,
    fromId,
    toId,
    method,
    mode,
    dot,
    amount,
    note,
    createdAt,
    updatedAt,
  } of transactionList) {
    const vendorFrom = vendors.get(fromId);
    const vendorTo = vendors.get(toId);
    const memberFrom = members.get(fromId);
    const memberTo = members.get(toId);

    if (vendorFrom || vendorTo) {
      await prisma.vendorTransaction.create({
        data: {
          transactionType: transactionTypeMap[mode],
          transactionAt: dot,
          method: method as any,
          amount,
          note: note || "",
          createdAt,
          updatedAt,
          vendor: {
            connect: {
              id: vendorFrom || vendorTo,
            },
          },
          member: {
            connect: {
              id: memberFrom || memberTo,
            },
          },
        },
      });
    } else {
      await prisma.memberTransaction.create({
        data: {
          transactionType: transactionTypeMap[mode],
          transactionAt: dot,
          method: method as any,
          amount,
          note: note || "",
          createdAt,
          updatedAt,
          from: {
            connect: {
              id: memberFrom,
            },
          },
          to: {
            connect: {
              id: memberTo,
            },
          },
        },
      });
    }
  }

  await calculateReturnsHandler();

  return;
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
