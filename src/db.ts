import { Prisma, PrismaClient, Transaction } from "@prisma/client";

import cache from "./lib/cache";
import { transactionMiddlewareHandler } from "./logic/middleware";
import { vendorMiddlewareHandler } from "./logic/vendor-middleware";

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

export const vendorExtends = Prisma.defineExtension({
  name: "vendorExtends",
  query: {
    transaction: {
      async create({ args, query }) {
        // Execute the original create query
        const created = await query(args);
        if (
          created.transactionType &&
          ["VENDOR_INVEST", "VENDOR_RETURNS"].includes(created.transactionType)
        ) {
          await vendorMiddlewareHandler();
        }
        return created;
      },

      async delete({ args, query }) {
        const transaction = await prisma.transaction.findUnique(args);
        // Execute the original update query
        const deleted = await query(args);
        if (
          transaction &&
          transaction.transactionType &&
          ["VENDOR_INVEST", "VENDOR_RETURNS"].includes(
            transaction.transactionType
          )
        ) {
          await vendorMiddlewareHandler();
        }
        return deleted;
      },
    },
  },
});

export const cacheExtends = Prisma.defineExtension({
  name: "cacheHandler",
  query: {
    $allModels: {
      async findFirst({ args, query, model }) {
        // Generate a cache key
        const cacheKey = `${model}:findFirst:${JSON.stringify(args)}`;

        // Check if data is already in cache
        const cachedData = cache.get(cacheKey);
        if (cachedData && !process.env.SKIP_CACHE) {
          console.log(`Cache hit for ${cacheKey}`);
          return cachedData;
        }

        console.log(`Cache miss for ${cacheKey}`);
        const result = await query(args);

        // Cache the result
        cache.set(cacheKey, result);
        return result;
      },
      async findUnique({ args, query, model }) {
        // Generate a cache key
        const cacheKey = `${model}:findUnique:${JSON.stringify(args)}`;

        // Check if data is already in cache
        const cachedData = cache.get(cacheKey);
        if (cachedData && !process.env.SKIP_CACHE) {
          console.log(`Cache hit for ${cacheKey}`);
          return cachedData;
        }

        console.log(`Cache miss for ${cacheKey}`);
        const result = await query(args);

        // Cache the result
        cache.set(cacheKey, result);
        return result;
      },
      async findMany({ args, query, model }) {
        // Generate a cache key
        const cacheKey = `${model}:findMany:${JSON.stringify(args)}`;

        // Check if data is already in cache
        const cachedData = cache.get(cacheKey);
        if (cachedData && !process.env.SKIP_CACHE) {
          console.log(`Cache hit for ${cacheKey}`);
          return cachedData;
        }

        console.log(`Cache miss for ${cacheKey}`);
        const result = await query(args);

        // Cache the result
        cache.set(cacheKey, result);
        return result;
      },
      async create({ args, query, model }) {
        const result = await query(args);

        // Reset cache after an update
        cache.flushAll(); // Alternatively, clear specific keys if needed
        console.log(`Cache cleared after ${model}:update`);
        return result;
      },
      async update({ args, query, model }) {
        const result = await query(args);

        // Reset cache after an update
        cache.flushAll(); // Alternatively, clear specific keys if needed
        console.log(`Cache cleared after ${model}:update`);
        return result;
      },
      async delete({ args, query, model }) {
        const result = await query(args);

        // Reset cache after a delete
        cache.flushAll(); // Alternatively, clear specific keys if needed
        console.log(`Cache cleared after ${model}:delete`);
        return result;
      },
    },
  },
});

const prismaClientSingleton = () => {
  return (
    new PrismaClient({
      log: ["error"],
    })
      // .$extends(cacheExtends)
      .$extends(transactionExtends)
      .$extends(vendorExtends)
  );
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

prisma;

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
