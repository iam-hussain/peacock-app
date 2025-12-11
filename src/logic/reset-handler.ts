import { updatePassbookByTransaction } from "./transaction-handler";

import prisma from "@/db";
import { clearCache } from "@/lib/cache";
import {
  bulkPassbookUpdate,
  fetchAllPassbook,
  initializePassbookToUpdate,
} from "@/lib/helper";

/**
 * Resets all passbooks by recalculating from all transactions
 * This is useful for data integrity checks or full recalculations
 * @returns Promise resolving to bulk update result
 */
export async function resetAllTransactionMiddlewareHandler() {
  clearCache();

  const [transactions, passbooks] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { transactionAt: "asc" } }),
    fetchAllPassbook(),
  ]);

  const passbookToUpdate = initializePassbookToUpdate(passbooks, true);

  // Process all transactions in chronological order
  let updatedPassbooks = passbookToUpdate;
  for (const transaction of transactions) {
    updatedPassbooks = updatePassbookByTransaction(
      updatedPassbooks,
      transaction
    );
  }

  return bulkPassbookUpdate(updatedPassbooks);
}
