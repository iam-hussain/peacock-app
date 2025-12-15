import { Transaction } from "@prisma/client";

import {
  PassbookConfigAction,
  PassbookConfigActionValue,
  transactionPassbookSettings,
} from "./settings";

import prisma from "@/db";
import {
  bulkPassbookUpdate,
  initializePassbookToUpdate,
  setPassbookUpdateQuery,
} from "@/lib/helper";
import { MemberFinancialSnapshot } from "@/lib/validators/type";

type PassbookConfigActionValueMap = {
  [key in PassbookConfigActionValue]: number;
};

function getPassbookUpdateQuery(
  passbook: Parameters<typeof prisma.passbook.update>[0],
  values: PassbookConfigActionValueMap,
  action:
    | PassbookConfigAction["CLUB"]
    | PassbookConfigAction["FROM"]
    | PassbookConfigAction["TO"]
): Parameters<typeof prisma.passbook.update>[0] {
  const data: any = passbook.data.payload || {};

  return setPassbookUpdateQuery(passbook, {
    ...Object.fromEntries(
      Object.entries(action?.ADD || {}).map(([key, value]) => [
        key,
        Number(data[key as string] || 0) + values[value],
      ])
    ),
    ...Object.fromEntries(
      Object.entries(action?.SUB || {}).map(([key, value]) => [
        key,
        Number(data[key as string] || 0) - values[value],
      ])
    ),
    ...Object.fromEntries(
      Object.entries(action?.EQUAL || {}).map(([key, value]) => [
        key,
        values[value],
      ])
    ),
  });
}

const getTractionPassbook = async ({ fromId, toId }: Transaction) => {
  return prisma.passbook.findMany({
    where: {
      OR: [{ account: { id: { in: [fromId, toId] } } }, { kind: "CLUB" }],
    },
    select: {
      id: true,
      kind: true,
      payload: true,
      account: { select: { id: true } },
    },
  });
};

type PassbookToUpdate = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;

export const updatePassbookByTransaction = (
  passbookToUpdate: PassbookToUpdate,
  transaction: Transaction,
  isRevert: Boolean = false
) => {
  const transactionPassbooks: any = {
    FROM: transaction.fromId,
    TO: transaction.toId,
    CLUB: "CLUB",
  };

  const values: PassbookConfigActionValueMap = {
    AMOUNT: transaction.amount,
    DEPOSIT_DIFF: 0,
    TOTAL: transaction.amount,
  };

  // Withdraw Transaction Handler (Revert)
  if (transaction.type === "WITHDRAW" && !isRevert) {
    const toPassbook = passbookToUpdate.get(transaction.toId);
    if (toPassbook) {
      const { periodicDepositsTotal = 0, withdrawalsTotal = 0 } = (toPassbook
        .data.payload || {}) as MemberFinancialSnapshot;
      const totalWithdrawalAmount = withdrawalsTotal + transaction.amount;
      const totalWithdrawalProfit =
        totalWithdrawalAmount > periodicDepositsTotal
          ? totalWithdrawalAmount - periodicDepositsTotal
          : 0;
      values.DEPOSIT_DIFF = totalWithdrawalProfit;
      values.AMOUNT = transaction.amount - totalWithdrawalProfit;
    }
  }

  // Withdraw Transaction Handler (Non Revert and Revert)
  if (transaction.type === "WITHDRAW") {
    const toPassbook = passbookToUpdate.get(transaction.toId);
    if (toPassbook) {
      const {
        periodicDepositsTotal = 0,
        withdrawalsTotal = 0,
        profitWithdrawalsTotal = 0,
      } = (toPassbook.data.payload || {}) as MemberFinancialSnapshot;
      // Non Revert case
      if (!isRevert) {
        const totalWithdrawalAmount = withdrawalsTotal + transaction.amount;
        const totalWithdrawalProfit =
          totalWithdrawalAmount > periodicDepositsTotal
            ? totalWithdrawalAmount - periodicDepositsTotal
            : 0;
        values.DEPOSIT_DIFF = totalWithdrawalProfit;
        values.AMOUNT = transaction.amount - totalWithdrawalProfit;
      } else {
        // Revert case
        values.DEPOSIT_DIFF =
          transaction.amount > profitWithdrawalsTotal
            ? profitWithdrawalsTotal
            : transaction.amount;
        values.AMOUNT =
          transaction.amount > profitWithdrawalsTotal
            ? Math.max(transaction.amount - profitWithdrawalsTotal, 0)
            : 0;
      }
    }
  }

  Object.entries(transactionPassbookSettings).forEach(
    ([transactionType, passbooksOf]) => {
      if (transaction.type === transactionType) {
        Object.entries(passbooksOf).forEach(([passbookOf, action]: any[]) => {
          const currentPassbook = passbookToUpdate.get(
            transactionPassbooks[passbookOf]
          );
          if (currentPassbook) {
            let currentAction = action;
            if (isRevert) {
              currentAction = { ADD: action.SUB, SUB: action.ADD };
            }
            passbookToUpdate.set(
              transactionPassbooks[passbookOf],
              getPassbookUpdateQuery(currentPassbook, values, currentAction)
            );
          }
        });
      }
    }
  );

  return passbookToUpdate;
};

export async function transactionEntryHandler(
  created: Transaction,
  isDelete: boolean = false
) {
  try {
    const passbooks = await getTractionPassbook(created);

    // Validate CLUB passbook exists for LOAN_INTEREST transactions
    if (created.type === "LOAN_INTEREST") {
      const clubPassbook = passbooks.find((p) => p.kind === "CLUB");
      if (!clubPassbook) {
        const error = new Error(
          `CLUB passbook not found for LOAN_INTEREST transaction ${created.id}. ` +
            `This will cause interestCollectedTotal to be out of sync.`
        );
        console.error("❌", error.message);
        throw error;
      }
    }

    let passbookToUpdate = initializePassbookToUpdate(passbooks, false);

    passbookToUpdate = updatePassbookByTransaction(
      passbookToUpdate,
      created,
      isDelete
    );

    // Validate CLUB passbook is in the update map for LOAN_INTEREST
    if (created.type === "LOAN_INTEREST" && !passbookToUpdate.has("CLUB")) {
      const error = new Error(
        `CLUB passbook not in update map for LOAN_INTEREST transaction ${created.id}. ` +
          `This will cause interestCollectedTotal to be out of sync.`
      );
      console.error("❌", error.message);
      throw error;
    }

    // Loan history is now calculated on-the-fly from transactions
    // No need to store or recalculate loanHistory in passbook
    await bulkPassbookUpdate(passbookToUpdate);

    // Log successful processing for LOAN_INTEREST transactions
    if (created.type === "LOAN_INTEREST") {
      console.log(
        `✅ Processed LOAN_INTEREST: ₹${created.amount.toLocaleString("en-IN")} ` +
          `(ID: ${created.id}, fromId: ${created.fromId}, toId: ${created.toId})`
      );
    }
  } catch (error) {
    console.error(
      `❌ Failed to process transaction ${created.id} (type: ${created.type}):`,
      error
    );
    // Re-throw to ensure caller knows the transaction processing failed
    // This is critical - if passbook update fails, the transaction exists but passbook is out of sync
    throw error;
  }
}
