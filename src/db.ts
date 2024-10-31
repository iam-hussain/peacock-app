import {
  Prisma,
  PrismaClient,
  Transaction,
  TRANSACTION_TYPE,
} from "@prisma/client";

import { handlePassbookEntry } from "./passbook/middleware";
import { calculateReturnsHandler } from "./passbook/returns-handler";

export const passbookExtends = Prisma.defineExtension({
  name: "Passbook",
  query: {
    transaction: {
      async create({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        await handlePassbookEntry(created as Transaction);
        return created;
      },

      async delete({ args, query }) {
        const transaction = await prisma.transaction.findUnique(args);
        // Execute the original update query
        const deleted = await query(args);
        await handlePassbookEntry(transaction as Transaction, true);

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
    transaction: {
      async create({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        if (
          [TRANSACTION_TYPE.RETURNS, TRANSACTION_TYPE.PROFIT].includes(
            (created?.transactionType as any) || ""
          )
        ) {
          await calculateReturnsHandler();
        }

        return created;
      },

      async update({ args, query }) {
        // Execute the original update query
        const transaction = (await prisma.transaction.findUnique({
          where: args.where,
        })) as any;
        const updated = (await query(args)) as any;
        if (
          [TRANSACTION_TYPE.RETURNS, TRANSACTION_TYPE.PROFIT].includes(
            updated?.transactionType || ""
          ) ||
          [TRANSACTION_TYPE.RETURNS, TRANSACTION_TYPE.PROFIT].includes(
            transaction?.transactionType || ""
          )
        ) {
          await calculateReturnsHandler();
        }

        return updated;
      },

      async delete({ args, query }) {
        // Execute the original update query
        const transaction = (await prisma.transaction.findUnique({
          where: args.where,
        })) as any;
        const deleted = await query(args);
        if (
          [TRANSACTION_TYPE.RETURNS, TRANSACTION_TYPE.PROFIT].includes(
            transaction?.transactionType || ""
          )
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
