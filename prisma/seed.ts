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

  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.passbook.deleteMany();

  // Insert the data into Prisma models
  await prisma.passbook.createMany({ data: backupData.passbook });

  // Map accounts to include new auth fields with defaults
  const accountsWithDefaults = backupData.account.map((account: any) => ({
    ...account,
    username: account.username || null,
    passwordHash: account.passwordHash || null,
    canRead: account.canRead ?? true,
    canWrite: account.canWrite ?? false,
    lastLoginAt: account.lastLoginAt || null,
  }));

  await prisma.account.createMany({
    data: accountsWithDefaults,
  });

  // Map transactions to include new audit fields with defaults
  // createdByActor is required, so we default to ADMIN for seed data
  const transactionsWithDefaults = backupData.transaction.map(
    (transaction: any) => ({
      ...transaction,
      createdByActor: (transaction.createdByActor as "ADMIN" | "MEMBER") || "ADMIN",
      createdById: transaction.createdById || null,
      updatedByActor: transaction.updatedByActor
        ? (transaction.updatedByActor as "ADMIN" | "MEMBER")
        : null,
      updatedById: transaction.updatedById || null,
    })
  );

  await prisma.transaction.createMany({
    data: transactionsWithDefaults,
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
