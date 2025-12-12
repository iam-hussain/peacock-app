/* eslint-disable unused-imports/no-unused-vars */

import { updatePassbookByTransaction } from './transaction-handler'

import prisma from '@/db'
import { clearCache } from '@/lib/cache'
import {
  bulkPassbookUpdate,
  fetchAllPassbook,
  initializePassbookToUpdate,
} from '@/lib/helper'

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

  return bulkPassbookUpdate(passbookToUpdate)
}
