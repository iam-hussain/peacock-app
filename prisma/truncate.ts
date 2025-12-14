import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

async function truncate() {
  // Delete in order to respect foreign key constraints
  // 1. Delete transactions first (they reference accounts)
  await prisma.transaction.deleteMany();
  // 2. Delete accounts (this automatically clears passbookId references)
  await prisma.account.deleteMany();
  // 3. Delete passbooks
  await prisma.passbook.deleteMany();
  // 4. Delete summaries
  await prisma.summary.deleteMany();

  console.log("All records have been deleted");
}

truncate()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
