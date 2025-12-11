/* eslint-disable unused-imports/no-unused-vars */

import { calculateLoansHandler } from "./loan-handler";
import { updatePassbookByTransaction } from "./transaction-handler";

import prisma from "@/db";
import { clearCache } from "@/lib/cache";
import {
  bulkPassbookUpdate,
  fetchAllLoanPassbook,
  fetchAllPassbook,
  initializePassbookToUpdate,
} from "@/lib/helper";

export async function resetAllTransactionMiddlewareHandler() {
  clearCache();

  const [transactions, passbooks] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { transactionAt: "asc" } }),
    fetchAllPassbook(),
  ]);

  let passbookToUpdate = initializePassbookToUpdate(passbooks, true);

  for (let transaction of transactions) {
    passbookToUpdate = updatePassbookByTransaction(
      passbookToUpdate,
      transaction
    );
  }

  return bulkPassbookUpdate(passbookToUpdate);
}

export async function resetAllLoanHandler() {
  clearCache();

  const [transactions, passbooks] = await Promise.all([
    prisma.transaction.findMany({
      where: { transactionType: { in: ["LOAN_TAKEN", "LOAN_REPAY"] } },
      orderBy: { transactionAt: "asc" },
    }),
    fetchAllLoanPassbook(),
  ]);

  let passbookToUpdate = initializePassbookToUpdate(passbooks, false);
  passbookToUpdate = calculateLoansHandler(passbookToUpdate, transactions);

  return bulkPassbookUpdate(passbookToUpdate);
}
