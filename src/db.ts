import { Prisma, PrismaClient, Transaction, Vendor } from "@prisma/client";

import { bulkPassbookUpdate } from "./lib/helper";
import { connectionMiddleware } from "./logic/connection-middleware";
import {
  seedTransactionMiddlewareHandler,
  transactionMiddlewareHandler,
} from "./logic/middleware";

export const seedTransactionExtends = Prisma.defineExtension({
  name: "seedTransactionHandler",
  query: {
    transaction: {
      async create({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        await seedTransactionMiddlewareHandler(created as Transaction);
        return created;
      },
    },
  },
});

export const transactionExtends = Prisma.defineExtension({
  name: "transactionHandler",
  query: {
    transaction: {
      async create({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        await transactionMiddlewareHandler(created as Transaction);
        return created;
      },

      async delete({ args, query }) {
        const transaction = await prisma.transaction.findUnique(args);
        // Execute the original update query
        const deleted = await query(args);
        await transactionMiddlewareHandler(transaction as Transaction, true);

        return deleted;
      },
    },
  },
});

export const connectionExtends = Prisma.defineExtension({
  name: "connectionHandler",
  query: {
    vendorProfitShare: {
      async update({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        const passbookToUpdate = await connectionMiddleware();
        await bulkPassbookUpdate(passbookToUpdate);
        return created;
      },
    },
    member: {
      async create({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        const passbookToUpdate = await connectionMiddleware();
        await bulkPassbookUpdate(passbookToUpdate);
        return created;
      },
    },
    vendor: {
      async create({ args, query }) {
        // Execute the original create query
        const created = (await query(args)) as Vendor;

        if (["DEFAULT", "CHIT", "BANK"].includes(created?.type || "")) {
          const passbookToUpdate = await connectionMiddleware();
          await bulkPassbookUpdate(passbookToUpdate);
        }

        return created;
      },

      async delete({ args, query }) {
        const vendor = await prisma.vendor.findUnique(args);

        // Execute the original update query
        const deleted = await query(args);

        if (["DEFAULT", "CHIT", "BANK"].includes(vendor?.type || "")) {
          const passbookToUpdate = await connectionMiddleware();
          await bulkPassbookUpdate(passbookToUpdate);
        }
        return deleted;
      },
    },
  },
});

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["error"],
  })
    .$extends(transactionExtends)
    .$extends(connectionExtends);
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

prisma;

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
