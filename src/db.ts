import {
  MemberTransaction,
  Prisma,
  PrismaClient,
  VENDOR_TRANSACTION_TYPE,
  VendorTransaction,
} from "@prisma/client";

import {
  handleMemberPassbookEntry,
  handleVendorPassbookEntry,
} from "./passbook/middleware";
import { calculateReturnsHandler } from "./passbook/returns-handler";

export const passbookExtends = Prisma.defineExtension({
  name: "Passbook",
  query: {
    memberTransaction: {
      async create({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        await handleMemberPassbookEntry(created as MemberTransaction);
        return created;
      },

      async delete({ args, query }) {
        const transaction = await prisma.memberTransaction.findUnique(args);
        // Execute the original update query
        const deleted = await query(args);
        await handleMemberPassbookEntry(transaction as MemberTransaction, true);

        return deleted;
      },
    },
    vendorTransaction: {
      async create({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        await handleVendorPassbookEntry(created as VendorTransaction);
        return created;
      },

      async delete({ args, query }) {
        const transaction = await prisma.vendorTransaction.findUnique(args);
        // Execute the original update query
        const deleted = await query(args);
        await handleVendorPassbookEntry(transaction as VendorTransaction, true);

        return deleted;
      },
    },
  },
});

export const returnsCalculatorExtends = Prisma.defineExtension({
  name: "returnsCalculator",
  query: {
    member: {
      async create({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        await calculateReturnsHandler();
        return created;
      },

      async delete({ args, query }) {
        // Execute the original update query
        const deleted = await query(args);
        await calculateReturnsHandler();

        return deleted;
      },
    },
    vendor: {
      async create({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        await calculateReturnsHandler();
        return created;
      },

      async delete({ args, query }) {
        // Execute the original update query
        const deleted = await query(args);
        await calculateReturnsHandler();

        return deleted;
      },
    },
    vendorTransaction: {
      async create({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        if (
          [
            VENDOR_TRANSACTION_TYPE.PERIODIC_RETURN,
            VENDOR_TRANSACTION_TYPE.RETURNS,
            VENDOR_TRANSACTION_TYPE.PROFIT,
          ].includes((created?.transactionType as any) || "")
        ) {
          await calculateReturnsHandler();
        }

        return created;
      },

      async update({ args, query }) {
        // Execute the original update query
        const transaction = (await prisma.vendorTransaction.findUnique({
          where: args.where,
        })) as any;
        const updated = (await query(args)) as any;
        if (
          [
            VENDOR_TRANSACTION_TYPE.PERIODIC_RETURN,
            VENDOR_TRANSACTION_TYPE.RETURNS,
            VENDOR_TRANSACTION_TYPE.PROFIT,
          ].includes(updated?.transactionType || "") ||
          [
            VENDOR_TRANSACTION_TYPE.PERIODIC_RETURN,
            VENDOR_TRANSACTION_TYPE.RETURNS,
            VENDOR_TRANSACTION_TYPE.PROFIT,
          ].includes(transaction?.transactionType || "")
        ) {
          await calculateReturnsHandler();
        }

        return updated;
      },

      async delete({ args, query }) {
        // Execute the original update query
        const transaction = (await prisma.vendorTransaction.findUnique({
          where: args.where,
        })) as any;
        const deleted = await query(args);
        if (
          [
            VENDOR_TRANSACTION_TYPE.PERIODIC_RETURN,
            VENDOR_TRANSACTION_TYPE.RETURNS,
            VENDOR_TRANSACTION_TYPE.PROFIT,
          ].includes(transaction?.transactionType || "")
        ) {
          await calculateReturnsHandler();
        }

        return deleted;
      },
    },
    vendorProfitShare: {
      async update({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        await calculateReturnsHandler();
        return created;
      },
      async delete({ args, query }) {
        // Execute the original update query
        const deleted = await query(args);
        await calculateReturnsHandler();

        return deleted;
      },
    },
  },
});

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["error"],
  })
    .$extends(passbookExtends)
    .$extends(returnsCalculatorExtends);
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

prisma;

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
