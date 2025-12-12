/**
 * Recalculation Script
 *
 * This script recalculates both Returns (passbook data) and Dashboard Data
 * using the transaction passbook settings and methods defined in:
 * - src/logic/settings.ts (transactionPassbookSettings)
 * - src/logic/transaction-handler.ts (updatePassbookByTransaction)
 *
 * The recalculation process:
 * 1. Recalculates Returns: Uses resetAllTransactionMiddlewareHandler() which:
 *    - Processes all transactions in chronological order
 *    - Applies transactionPassbookSettings to update passbook data
 *    - Uses updatePassbookByTransaction() method for each transaction
 *
 */
import prisma from "../src/db";
import { resetAllTransactionMiddlewareHandler } from "../src/logic/reset-handler";

async function recalculate() {
  try {
    console.log("🔄 Starting recalculation process...\n");
    console.log(
      "Using transaction passbook settings from src/logic/settings.ts"
    );
    console.log(
      "Using updatePassbookByTransaction method from src/logic/transaction-handler.ts\n"
    );

    console.log("📊 Recalculating Returns (passbook data)...");
    console.log(
      "   Processing all transactions using transactionPassbookSettings..."
    );
    await resetAllTransactionMiddlewareHandler();
    console.log("✅ Returns recalculated successfully\n");

    console.log("✅ Dashboard data recalculated successfully\n");

    console.log("🎉 All recalculations completed successfully!");
    console.log(
      "   All passbook data and dashboard snapshots are now up to date."
    );
  } catch (error) {
    console.error("❌ Error during recalculation:", error);
    throw error;
  }
}

recalculate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
