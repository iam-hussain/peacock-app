import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

async function truncate() {
  await prisma.account.updateMany({ data: { passbookId: null } });
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.passbook.deleteMany();
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
