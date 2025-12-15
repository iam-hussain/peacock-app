import { PrismaClient } from "@prisma/client";
import { ObjectId } from "mongodb";

const prisma = new PrismaClient({ log: ["error"] });

async function truncate() {
  try {
    // Delete in order to respect foreign key constraints
    // 1. Delete transactions first (they reference accounts)
    await prisma.transaction.deleteMany();

    // 2. Delete passbooks (now safe since no accounts reference them)
    await prisma.passbook.deleteMany();

    // 3. Delete summaries
    await prisma.summary.deleteMany();

    // 4. Delete accounts
    await prisma.account.deleteMany();

    console.log("All records have been deleted");
  } catch (error: any) {
    // Retry once if it's a transaction conflict
    if (error.code === "P2034") {
      console.log("Retrying after transaction conflict...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await prisma.transaction.deleteMany();
      // Clear passbookId references: first set to unique temp ObjectIDs, then to null
      const accounts = await prisma.account.findMany({
        where: { passbookId: { not: null } },
        select: { id: true, passbookId: true },
      });

      // Step 1: Set each account to a unique temporary ObjectID value
      for (let i = 0; i < accounts.length; i++) {
        const tempObjectId = new ObjectId().toString();
        await prisma.account.update({
          where: { id: accounts[i].id },
          data: { passbookId: tempObjectId },
        });
      }

      // Step 2: Now set all to null
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
