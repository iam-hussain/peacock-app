/* eslint-disable unused-imports/no-unused-vars */
import { Transaction } from "@prisma/client";

import {
  calculatedVendorsConnection,
  fetchAllProfitShares,
} from "./connection-middleware";
import { calculateLoansHandler, memberLoanMiddleware } from "./loan-middleware";
import { transactionMiddleware } from "./transaction-middleware";

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
  console.log("000000000");
  let passbookToUpdate = initializePassbookToUpdate(passbooks, false);
  console.log("1111111111111");

  passbookToUpdate = transactionMiddleware(passbookToUpdate, created, isDelete);
  console.log("2222222");
  if (
    ["LOAN_TAKEN", "LOAN_REPAY", "LOAN_INTEREST"].includes(
      created.transactionType
    )
  ) {
    passbookToUpdate = await memberLoanMiddleware(passbookToUpdate, created);
  }

  console.log("3333");
  return bulkPassbookUpdate(passbookToUpdate);
}

export async function resetAllTransactionMiddlewareHandler() {
  cache.flushAll();

  const [transactions, passbooks, profitShare] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: {
        transactionAt: "asc",
      },
    }),
    fetchAllPassbook(),
    fetchAllProfitShares(),
  ]);

  let passbookToUpdate = initializePassbookToUpdate(passbooks, true);

  for (let transaction of transactions) {
    passbookToUpdate = transactionMiddleware(passbookToUpdate, transaction);
  }
  passbookToUpdate = calculateLoansHandler(passbookToUpdate, transactions);

  passbookToUpdate = calculatedVendorsConnection(passbookToUpdate, profitShare);

  return bulkPassbookUpdate(passbookToUpdate);
}
