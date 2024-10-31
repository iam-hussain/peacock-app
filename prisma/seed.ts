import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function seed() {
  const backupFilePath = path.join(
    process.cwd(),
    "public",
    "peacock_backup.json"
  );
  const backupData = JSON.parse(readFileSync(backupFilePath, "utf8"));

  const memberLoad: any = {};
  const loadVendor: any[] = [];
  const vendorMapData: any = {};
  const dupPass: any[] = [];
  const skipVendors: string[] = [];

  const vendorToCreate = backupData.vendors
    .map((e: any) => {
      if (e.type === "LEND") {
        skipVendors.push(e.id);
        if (!memberLoad[e.ownerId]) {
          memberLoad[e.ownerId] = e;
          loadVendor.push({ ...e, name: "Loan" });
        } else {
          dupPass.push(e.passbookId);
        }
        vendorMapData[e.id] = memberLoad[e.ownerId];
        return null;
      }

      return e;
    })
    .filter(Boolean);

  // Insert the data into Prisma models
  await prisma.member.createMany({ data: backupData.members });
  await prisma.vendor.createMany({ data: [...vendorToCreate, ...loadVendor] });

  await prisma.passbook.createMany({
    data: backupData.passbooks.filter((e: any) => !dupPass.includes(e.id)),
  });

  const holdingVendors: any = {};

  for (const memberTrans of backupData.memberTransactions) {
    const { fromId, toId, ...other } = memberTrans;
    const ids = {
      vendorId: toId,
      memberId: fromId,
    };

    if (["WITHDRAW"].includes(other.transactionType)) {
      ids.vendorId = fromId;
      ids.memberId = toId;
    }

    if (other.transactionType === "PERIODIC_INVEST") {
      other.transactionType = "INVEST";
    }

    if (other.transactionType === "PERIODIC_RETURN") {
      other.transactionType = "RETURNS";
    }

    if (
      ["RETURNS", "PERIODIC_RETURN"].includes(other.transactionType) &&
      other.amount <= 8000
    ) {
      other.transactionType = "PROFIT";
    }

    if (!holdingVendors[ids.vendorId]) {
      const vendor = backupData.members.find((e: any) => e.id === ids.vendorId);
      const hold = await prisma.vendor.create({
        data: {
          owner: {
            connect: {
              id: ids.vendorId,
            },
          },
          name: ids.vendorId,
          slug: ids.vendorId,
          passbook: {
            connect: {
              id: vendor.passbookId,
            },
          },
          type: "HOLD",
        },
      });
      holdingVendors[toId] = hold.id;
    }

    ids.vendorId = holdingVendors[ids.vendorId];

    await prisma.transaction.create({
      data: {
        ...other,
        ...ids,
      },
    });
  }

  const vendorTrans = backupData.vendorTransactions.map((e: any) => {
    if (vendorMapData[e.vendorId]) {
      e.vendorId = vendorMapData[e.vendorId].id;
    }
    if (e.transactionType === "PERIODIC_INVEST") {
      e.transactionType = "INVEST";
    }

    if (e.transactionType === "PERIODIC_RETURN") {
      e.transactionType = "RETURNS";
    }

    if (
      ["RETURNS", "PERIODIC_RETURN"].includes(e.transactionType) &&
      e.amount <= 8000
    ) {
      e.transactionType = "PROFIT";
    }

    return e;
  });

  await prisma.transaction.createMany({
    data: vendorTrans,
  });
  await prisma.vendorProfitShare.createMany({
    data: backupData.vendorProfitShares.filter(
      (e: any) => !skipVendors.includes(e.vendorId)
    ),
  });
}

seed()
  .then(() => {
    console.log("Data restored successfully.");
  })
  .catch((error) => {
    console.error("Error restoring data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
