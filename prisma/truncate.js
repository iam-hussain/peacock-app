import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function truncate() {
  // Truncate all tables
  await prisma.memberTransaction.deleteMany();
  await prisma.vendorProfitShare.deleteMany();
  await prisma.vendorTransaction.deleteMany();
  await prisma.member.deleteMany();
  await prisma.vendor.deleteMany();
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