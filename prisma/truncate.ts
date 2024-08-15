// prisma/truncate.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function truncate() {
  // Truncate all tables
  await prisma.member.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.memberTransaction.deleteMany();
  await prisma.vendorTransaction.deleteMany();
  await prisma.vendorProfitShare.deleteMany();
  await prisma.passbook.deleteMany();

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
