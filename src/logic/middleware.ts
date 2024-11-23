/* eslint-disable unused-imports/no-unused-vars */
import { Transaction } from "@prisma/client";

import { calculateLoansHandler, memberLoanMiddleware } from "./loan-middleware";
import { transactionMiddleware } from "./transaction-middleware";
import { vendorCalcHandler } from "./vendor-middleware";

import prisma from "@/db";
import cache from "@/lib/cache";
import {
  bulkPassbookUpdate,
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
  const passbooks = await getTractionPassbook(created);
  let passbookToUpdate = initializePassbookToUpdate(passbooks, false);

  passbookToUpdate = transactionMiddleware(passbookToUpdate, created, isDelete);
  if (
    ["LOAN_TAKEN", "LOAN_REPAY", "LOAN_INTEREST"].includes(
      created.transactionType
    )
  ) {
    passbookToUpdate = await memberLoanMiddleware(passbookToUpdate, created);
  }
  return bulkPassbookUpdate(passbookToUpdate);
}

export async function resetAllTransactionMiddlewareHandler() {
  cache.flushAll();

  const [transactions, passbooks, vendors] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: {
        transactionAt: "asc",
      },
    }),
    fetchAllPassbook(),
    prisma.account.findMany({
      where: {
        isMember: false,
      },
      select: {
        id: true,
      },
    }),
  ]);

  let passbookToUpdate = initializePassbookToUpdate(passbooks, true);

  for (let transaction of transactions) {
    passbookToUpdate = transactionMiddleware(passbookToUpdate, transaction);
  }
  passbookToUpdate = calculateLoansHandler(passbookToUpdate, transactions);

  passbookToUpdate = vendorCalcHandler(
    passbookToUpdate,
    vendors.map((e) => e.id)
  );

  // passbookToUpdate = calculatedVendorsConnection(passbookToUpdate, profitShare);

  return bulkPassbookUpdate(passbookToUpdate);
}
