import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function truncate() {
  // Truncate all tables (order matters due to foreign key constraints)
  // 1. Clear passbook references from accounts first
  await prisma.account.updateMany({
    data: { passbookId: null },
  });
  // 2. Delete transactions (no dependencies)
  await prisma.transaction.deleteMany();
  // 3. Delete accounts (after clearing passbook references)
  await prisma.account.deleteMany();
  // 4. Delete passbooks (after accounts are deleted)
  await prisma.passbook.deleteMany();
  // 5. Delete summaries
  await prisma.summary.deleteMany();

  console.log("All records have been deleted");
}

truncate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
