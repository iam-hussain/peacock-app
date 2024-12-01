/* eslint-disable unused-imports/no-unused-vars */
import { Transaction } from "@prisma/client";

import { calculateLoansHandler } from "./loan-middleware";
import { transactionMiddleware } from "./transaction-middleware";

import prisma from "@/db";
import { clearCache } from "@/lib/cache";
import {
  bulkPassbookUpdate,
  fetchAllLoanPassbook,
  fetchAllPassbook,
  initializePassbookToUpdate,
} from "@/lib/helper";

const getTractionPassbook = async ({ fromId, toId }: Transaction) => {
  return prisma.passbook.findMany({
    where: {
      OR: [
        {
          account: {
            id: { in: [fromId, toId] },
          },
        },
        { type: "CLUB" },
      ],
    },
    select: {
      id: true,
      type: true,
      payload: true,
      account: {
        select: {
          id: true,
        },
      },
    },
  });
};

export async function transactionMiddlewareHandler(
  created: Transaction,
  isDelete: boolean = false
) {
  clearCache();
  const passbooks = await getTractionPassbook(created);
  let passbookToUpdate = initializePassbookToUpdate(passbooks, false);

  passbookToUpdate = transactionMiddleware(passbookToUpdate, created, isDelete);
  return bulkPassbookUpdate(passbookToUpdate);
}

export async function resetAllTransactionMiddlewareHandler() {
  clearCache();

  const [transactions, passbooks] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: {
        transactionAt: "asc",
      },
    }),
    fetchAllPassbook(),
  ]);

  let passbookToUpdate = initializePassbookToUpdate(passbooks, true);

  for (let transaction of transactions) {
    passbookToUpdate = transactionMiddleware(passbookToUpdate, transaction);
  }

  return bulkPassbookUpdate(passbookToUpdate);
}

export async function resetAllLoanHandler() {
  clearCache();

  const [transactions, passbooks] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        transactionType: {
          in: ["LOAN_TAKEN", "LOAN_REPAY"],
        },
      },
      orderBy: {
        transactionAt: "asc",
      },
    }),
    fetchAllLoanPassbook(),
  ]);

  let passbookToUpdate = initializePassbookToUpdate(passbooks, false);
  passbookToUpdate = calculateLoansHandler(passbookToUpdate, transactions);

  return bulkPassbookUpdate(passbookToUpdate);
}
