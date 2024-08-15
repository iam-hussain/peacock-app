import { PrismaClient } from "@prisma/client";
import seedData from "../public/peacock_backup.json";

const prisma = new PrismaClient();

function createUsers() {
  return seedData.user
    .filter((e) => e.type == "MEMBER")
    .map(({ createdAt, updatedAt, deleted, deletedAt, ...each }: any) => {
      return prisma.member.create({
        data: {
          firstName: each.firstName,
          lastName: each.lastName,
          avatar: each.avatar,
          email: each.email,
          joinedAt: each.joinedAt,
          username: each.nickName,
          phone: each.mobileNumber,
          active: each.isActive,
          createdAt,
          updatedAt,
          deleted,
          deletedAt,
          passbook: {
            create: {
              type: "MEMBER",
              in: {},
              out: {},
              profit: {},
            },
          },
        },
      });
    });
}

function createVendors() {
  return seedData.user
    .filter((e) => e.type == "VENDOR")
    .map(({ createdAt, updatedAt, deleted, deletedAt, ...each }: any) => {
      return prisma.vendor.create({
        data: {
          name: each.firstName,
          slug: each.nickName,
          type: each.vendorType,
          startAt: each.joinedAt,
          active: each.isActive,
          createdAt,
          updatedAt,
          deleted,
          deletedAt,
          passbook: {
            create: {
              type: "VENDOR",
              in: {},
              out: {},
              profit: {},
            },
          },
        },
      });
    });
}

function createConnections(users: Map<any, any>, vendors: Map<any, any>) {
  return seedData.interLink.map(
    ({ deleted, deletedAt, vendorId, memberId, includeProfit }: any) => {
      return prisma.connection.create({
        data: {
          deleted,
          deletedAt,
          active: includeProfit,
          vendorId: vendors.get(vendorId),
          memberId: users.get(memberId),
        },
      });
    }
  );
}

function createTransactions(users: Map<any, any>) {
  return seedData.transaction.map(({ id, fromId, toId, ...each }: any) => {
    return prisma.transaction.create({
      data: {
        ...each,
        from: {
          connect: {
            id: users.get(fromId),
          },
        },
        to: {
          connect: {
            id: users.get(toId),
          },
        },
      },
    });
  });
}

async function getUserMap() {
  const userMap = new Map();
  const fetchedUsers = await prisma.member.findMany({
    select: {
      id: true,
      username: true,
      deleted: true,
    },
  });
  fetchedUsers.forEach((user) => {
    const match = seedData.user.find((le) => le.nickName === user.username);
    if (match) {
      userMap.set(match.id, user.id);
    }
  });
  return userMap;
}

async function getVendorMap() {
  const venderMap = new Map();
  const fetchedVendor = await prisma.vendor.findMany({
    select: {
      id: true,
      slug: true,
      deleted: true,
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
  const userTransactions = createUsers();
  const vendorTransactions = createVendors();

  await prisma.$transaction([
    ...userTransactions,
    ...vendorTransactions,
    prisma.passbook.create({
      data: {
        type: "CLUB",
        in: {},
        out: {},
        profit: {},
      },
    }),
  ]);

  const users = await getUserMap();
  const vendors = await getVendorMap();

  const connections = createConnections(users, vendors);
  await prisma.$transaction(connections);

  for (const { id, fromId, toId, ...transaction } of seedData.transaction) {
    await prisma.transaction.create({
      data: {
        ...(transaction as any),
        from: {
          connect: {
            id: users.get(fromId),
          },
        },
        to: {
          connect: {
            id: users.get(toId),
          },
        },
      },
    });
  }

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
