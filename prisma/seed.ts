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

  // Insert the data into Prisma models
  await prisma.member.createMany({ data: backupData.members });
  await prisma.vendor.createMany({ data: backupData.vendors });
  await prisma.memberTransaction.createMany({
    data: backupData.memberTransactions,
  });
  await prisma.vendorTransaction.createMany({
    data: backupData.vendorTransactions,
  });
  await prisma.vendorProfitShare.createMany({
    data: backupData.vendorProfitShares,
  });
  await prisma.passbook.createMany({ data: backupData.passbooks });
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
