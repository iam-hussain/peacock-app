import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

async function truncate() {
  try {
    // Delete in order to respect foreign key constraints
    // 1. Delete transactions first (they reference accounts)
    await prisma.transaction.deleteMany();

    // 2. Clear passbookId references from accounts before deleting
    await prisma.account.updateMany({
      data: { passbookId: null },
    });

    // 3. Delete accounts
    await prisma.account.deleteMany();

    // 4. Delete passbooks (now safe since no accounts reference them)
    await prisma.passbook.deleteMany();

    // 5. Delete summaries
    await prisma.summary.deleteMany();

    console.log("All records have been deleted");
  } catch (error: any) {
    // Retry once if it's a transaction conflict
    if (error.code === "P2034") {
      console.log("Retrying after transaction conflict...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await prisma.transaction.deleteMany();
      await prisma.account.updateMany({
        data: { passbookId: null },
      });
      await prisma.account.deleteMany();
      await prisma.passbook.deleteMany();
      await prisma.summary.deleteMany();

      console.log("All records have been deleted (after retry)");
    } else {
      throw error;
    }
  }
}

truncate()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
