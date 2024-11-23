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
  await prisma.account.createMany({ data: backupData.account });
  await prisma.transaction.createMany({
    data: backupData.transaction.map((transaction: any) => {
      let date = new Date(transaction.transactionAt);

      // Set IST (UTC +5:30) and change the time to 10:00 AM IST
      date.setUTCHours(4, 30, 0, 0); // 4:30 AM UTC is 10:00 AM IST

      return {
        ...transaction,
        transactionAt: date.toISOString(),
      };
    }),
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
