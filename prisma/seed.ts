import { PrismaClient } from "@prisma/client";

import backupData from "../public/peacock_backup.json";

import { seedTransactionExtends } from "@/db";

const prisma = new PrismaClient({
  log: ["error"],
}).$extends(seedTransactionExtends);

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

  const chitIds = backupData.vendors
    .filter((e) => e.type === "CHIT")
    .map((e) => e.id);

  const loanIds: string[] = [];
  const loanIdsMapMember: any = {};
  const skipPassbooks: string[] = [];

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

  // const memberLoad: any = {};
  // const loadVendor: any[] = [];
  // const loanMemberMap: any = {};
  // const dupPass: any[] = [];
  // const skipVendors: string[] = [];

  // const vendorToCreate = backupData.vendors
  //   .map((e: any) => {
  //     if (e.type === "LEND") {
  //       skipVendors.push(e.id);
  //       if (!memberLoad[e.ownerId]) {
  //         memberLoad[e.ownerId] = e;
  //         loadVendor.push({ ...e, name: "Loan" });
  //       } else {
  //         dupPass.push(e.passbookId);
  //       }
  //       loanMemberMap[e.id] = memberLoad[e.ownerId];
  //       return null;
  //     }

  //     return e;
  //   })
  //   .filter(Boolean);

  // // Insert the data into Prisma models
  // await prisma.member.createMany({ data: backupData.members });
  // await prisma.vendor.createMany({ data: [...vendorToCreate, ...loadVendor] });

  // await prisma.passbook.createMany({
  //   data: backupData.passbooks
  //     .filter((e: any) => !dupPass.includes(e.id))
  //     .map((e: Passbook) => ({
  //       id: e.id,
  //       type: e.type,
  //       calcReturns: e.calcReturns,
  //     })),
  // });

  // await prisma.vendorProfitShare.createMany({
  //   data: backupData.vendorProfitShares.filter(
  //     (e: any) => !skipVendors.includes(e.vendorId)
  //   ),
  // });

  // const holdingVendors: any = {};

  // for (const memberTrans of backupData.memberTransactions) {
  //   const { fromId, toId, ...other } = memberTrans;
  //   const ids = {
  //     memberId: fromId,
  //     vendorId: toId,
  //   };

  //   if (["WITHDRAW"].includes(other.transactionType)) {
  //     ids.vendorId = fromId;
  //     ids.memberId = toId;
  //   }

  //   if (other.transactionType === "PERIODIC_INVEST") {
  //     other.transactionType = "INVEST";
  //   }

  //   if (other.transactionType === "PERIODIC_RETURN") {
  //     other.transactionType = "RETURNS";
  //   }

  //   if (
  //     ["RETURNS", "PERIODIC_RETURN"].includes(other.transactionType) &&
  //     other.amount <= 8000
  //   ) {
  //     other.transactionType = "PROFIT";
  //   }

  //   if (!holdingVendors[ids.vendorId]) {
  //     const vendor = backupData.members.find((e: any) => e.id === ids.vendorId);
  //     const hold = await prisma.vendor.create({
  //       data: {
  //         owner: {
  //           connect: {
  //             id: ids.vendorId,
  //           },
  //         },
  //         name: ids.vendorId,
  //         slug: ids.vendorId,
  //         passbook: {
  //           connect: {
  //             id: vendor.passbookId,
  //           },
  //         },
  //         type: "HOLD",
  //       },
  //     });
  //     holdingVendors[toId] = hold.id;
  //   }

  //   ids.vendorId = holdingVendors[ids.vendorId];

  //   await prisma.transaction.create({
  //     data: {
  //       ...other,
  //       ...ids,
  //     },
  //   });
  //   // await seedTransactionMiddlewareHandler({
  //   //   ...other,
  //   //   ...ids,
  //   // });
  // }

  // const vendorTrans = backupData.vendorTransactions.map((e: any) => {
  //   if (loanMemberMap[e.vendorId]) {
  //     e.vendorId = loanMemberMap[e.vendorId].id;
  //   }
  //   if (e.transactionType === "PERIODIC_INVEST") {
  //     e.transactionType = "INVEST";
  //   }

  //   if (e.transactionType === "PERIODIC_RETURN") {
  //     e.transactionType = "RETURNS";
  //   }

  //   if (
  //     ["RETURNS", "PERIODIC_RETURN"].includes(e.transactionType) &&
  //     e.amount <= 8000
  //   ) {
  //     e.transactionType = "PROFIT";
  //   }

  //   return e;
  // });

  // for (const trans of vendorTrans) {
  //   await prisma.transaction.create({ data: trans });
  //   // await seedTransactionMiddlewareHandler(trans);
  // }
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
