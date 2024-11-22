import { PrismaClient } from "@prisma/client";

import backupData from "../public/peacock_backup.json";

// import { seedTransactionExtends } from "@/db";

const prisma = new PrismaClient({
  log: ["error"],
});
// .$extends(seedTransactionExtends);

async function seed() {
  // const backupFilePath = path.join(
  //   process.cwd(),
  //   "public",
  //   "peacock_backup.json"
  // );
  // const backupData = JSON.parse(readFileSync(backupFilePath, "utf8"));

  const membersCreated = await prisma.account.createMany({
    data: backupData.members.map((each) => ({
      id: each.id,
      firstName: each.firstName,
      lastName: each.lastName,
      phone: each.phone,
      email: each.email,
      avatar: each.avatar,
      startAt: new Date(each.joinedAt),
      active: each.active,
      isMember: true,
      passbookId: each.passbookId,
      createdAt: each.createdAt,
      updatedAt: each.updatedAt,
    })),
  });

  console.log(JSON.stringify({ membersCreated }));

  const chitPassbookIds = backupData.vendors
    .filter((e) => e.type === "CHIT")
    .map((e) => e.passbookId);

  const loanIds: string[] = [];
  const loanIdsMapMember: any = {};
  const skipPassbooks: string[] = [];

  console.log(
    JSON.stringify({
      chitPassbookIds,
      loanIds,
      loanIdsMapMember,
      skipPassbooks,
    })
  );

  backupData.vendors
    .filter((e) => e.type === "LEND")
    .forEach((e: any) => {
      loanIds.push(e.id);
      loanIdsMapMember[e.id] = e.ownerId;
      skipPassbooks.push(e.passbookId);
    });

  const vendorsCreated = await prisma.account.createMany({
    data: backupData.vendors
      .filter((each) => each.type !== "LEND")
      .map((each) => ({
        id: each.id,
        firstName: each.name,
        startAt: new Date(each.startAt),
        endAt: each.endAt ? new Date(each.endAt) : undefined,
        active: each.active,
        isMember: false,
        passbookId: each.passbookId,
        createdAt: each.createdAt,
        updatedAt: each.updatedAt,
      })),
  });

  console.log(JSON.stringify({ vendorsCreated }));

  const passbookCreated = await prisma.passbook.createMany({
    data: backupData.passbooks
      .filter((e: any) => !skipPassbooks.includes(e.id))
      .map((e) => ({
        id: e.id,
        type: e.type as any,
        isChit: chitPassbookIds.includes(e.id),
      })),
  });

  console.log(JSON.stringify({ passbookCreated }));

  const memberTransactionsCreated = await prisma.transaction.createMany({
    data: backupData.memberTransactions as any[],
  });

  console.log(JSON.stringify({ memberTransactionsCreated }));

  const vendorTransactionsCreated = await prisma.transaction.createMany({
    data: backupData.vendorTransactions.map((each) => {
      const { vendorId, memberId, transactionType, ...other } = each;

      const updated = {
        fromId: vendorId,
        toId: memberId,
        transactionType,
      };

      if (loanIds.includes(vendorId)) {
        const accountId = loanIdsMapMember[vendorId] || "";

        if (["PERIODIC_RETURN", "RETURNS"].includes(transactionType)) {
          updated.fromId = accountId;
          updated.toId = memberId;
          updated.transactionType = "LOAN_REPAY";
        }
        if (
          ["RETURNS", "PERIODIC_RETURN"].includes(transactionType) &&
          each.amount <= 8000
        ) {
          updated.fromId = accountId;
          updated.toId = memberId;
          updated.transactionType = "LOAN_INTEREST";
        }

        if (["INVEST", "PERIODIC_INVEST"].includes(transactionType)) {
          updated.fromId = memberId;
          updated.toId = accountId;
          updated.transactionType = "LOAN_TAKEN";
        }

        if (["PROFIT"].includes(transactionType)) {
          updated.fromId = accountId;
          updated.toId = memberId;
          updated.transactionType = "LOAN_INTEREST";
        }
      } else {
        if (["INVEST", "PERIODIC_INVEST"].includes(transactionType)) {
          updated.fromId = memberId;
          updated.toId = vendorId;
          updated.transactionType = "VENDOR_INVEST";
        }
        if (
          ["PERIODIC_RETURN", "RETURNS", "PROFIT"].includes(transactionType)
        ) {
          updated.fromId = vendorId;
          updated.toId = memberId;
          updated.transactionType = "VENDOR_RETURNS";
        }
      }

      return {
        ...other,
        ...updated,
      } as any;
    }),
  });

  console.log(JSON.stringify({ vendorTransactionsCreated }));
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
