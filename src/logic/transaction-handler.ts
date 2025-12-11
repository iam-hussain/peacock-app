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
import { MemberPassbookData, PassbookToUpdate } from "@/lib/type";

type PassbookConfigActionValueMap = {
  [key in PassbookConfigActionValue]: number;
};

type PassbookRole = "FROM" | "TO" | "CLUB";

/**
 * Builds a Prisma update query for a passbook based on transaction values and actions
 * @param passbook - Prisma passbook update parameters
 * @param values - Map of calculated values (AMOUNT, DEPOSIT_DIFF, TOTAL)
 * @param action - Configuration action defining ADD/SUB operations
 * @returns Updated Prisma passbook update parameters
 */
function buildPassbookUpdateQuery(
  passbook: Parameters<typeof prisma.passbook.update>[0],
  values: PassbookConfigActionValueMap,
  action:
    | PassbookConfigAction["CLUB"]
    | PassbookConfigAction["FROM"]
    | PassbookConfigAction["TO"]
): Parameters<typeof prisma.passbook.update>[0] {
  const payload = (passbook.data?.payload as Record<string, number>) || {};

  const updates: Record<string, number> = {};

  // Process ADD operations
  if (action?.ADD) {
    for (const [key, valueType] of Object.entries(action.ADD)) {
      const currentValue = Number(payload[key] || 0);
      updates[key] = currentValue + values[valueType];
    }
  }

  // Process SUB operations
  if (action?.SUB) {
    for (const [key, valueType] of Object.entries(action.SUB)) {
      const currentValue = Number(payload[key] || 0);
      updates[key] = currentValue - values[valueType];
    }
  }

  return setPassbookUpdateQuery(passbook, updates);
}

/**
 * Fetches passbooks related to a transaction (from account, to account, and club)
 * @param transaction - Transaction to get related passbooks for
 * @returns Array of passbooks with their account relationships
 */
async function getTransactionPassbooks(transaction: Transaction) {
  return prisma.passbook.findMany({
    where: {
      OR: [
        { account: { id: { in: [transaction.fromId, transaction.toId] } } },
        { type: "CLUB" },
      ],
    },
    select: {
      id: true,
      type: true,
      payload: true,
      account: { select: { id: true } },
    },
  });
}

/**
 * Calculates withdrawal profit amount when a member withdraws more than their periodic deposits
 * @param currentWithdrawalAmount - Current withdrawal amount in passbook
 * @param transactionAmount - Amount being withdrawn in this transaction
 * @param periodicDepositAmount - Total periodic deposits made by the member
 * @returns Object with deposit difference (profit) and adjusted amount
 */
function calculateWithdrawalProfit(
  currentWithdrawalAmount: number,
  transactionAmount: number,
  periodicDepositAmount: number
) {
  const totalWithdrawalAmount = currentWithdrawalAmount + transactionAmount;
  const profitAmount =
    totalWithdrawalAmount > periodicDepositAmount
      ? totalWithdrawalAmount - periodicDepositAmount
      : 0;
  const adjustedAmount = transactionAmount - profitAmount;

  return {
    depositDiff: profitAmount,
    amount: adjustedAmount,
  };
}

/**
 * Calculates withdrawal values for a transaction, handling both normal and revert cases
 * @param toPassbook - The passbook of the account receiving the withdrawal
 * @param transactionAmount - Amount of the transaction
 * @param isRevert - Whether this is a revert operation
 * @returns Map of calculated values for the transaction
 */
function calculateWithdrawalValues(
  toPassbook: Parameters<typeof prisma.passbook.update>[0] | undefined,
  transactionAmount: number,
  isRevert: boolean
): PassbookConfigActionValueMap {
  const values: PassbookConfigActionValueMap = {
    AMOUNT: transactionAmount,
    DEPOSIT_DIFF: 0,
    TOTAL: transactionAmount,
  };

  if (!toPassbook) {
    return values;
  }

  const payload = (toPassbook.data?.payload || {}) as MemberPassbookData;
  const {
    periodicDepositAmount = 0,
    withdrawalAmount = 0,
    profitWithdrawalAmount = 0,
  } = payload;

  if (!isRevert) {
    // Normal withdrawal: calculate profit portion
    const { depositDiff, amount } = calculateWithdrawalProfit(
      withdrawalAmount,
      transactionAmount,
      periodicDepositAmount
    );
    values.DEPOSIT_DIFF = depositDiff;
    values.AMOUNT = amount;
  } else {
    // Revert withdrawal: restore profit portion
    values.DEPOSIT_DIFF =
      transactionAmount > profitWithdrawalAmount
        ? profitWithdrawalAmount
        : transactionAmount;
    values.AMOUNT = Math.max(transactionAmount - profitWithdrawalAmount, 0);
  }

  return values;
}

/**
 * Updates passbooks based on a transaction according to configured rules
 * @param passbookToUpdate - Map of passbooks being updated
 * @param transaction - Transaction to process
 * @param isRevert - Whether this is a revert operation (defaults to false)
 * @returns Updated passbook map
 */
export function updatePassbookByTransaction(
  passbookToUpdate: PassbookToUpdate,
  transaction: Transaction,
  isRevert = false
): PassbookToUpdate {
  const passbookRoles: Record<PassbookRole, string> = {
    FROM: transaction.fromId,
    TO: transaction.toId,
    CLUB: "CLUB",
  };

  // Initialize base values
  const values: PassbookConfigActionValueMap = {
    AMOUNT: transaction.amount,
    DEPOSIT_DIFF: 0,
    TOTAL: transaction.amount,
  };

  // Calculate withdrawal-specific values
  if (transaction.transactionType === "WITHDRAW") {
    const toPassbook = passbookToUpdate.get(transaction.toId);
    const withdrawalValues = calculateWithdrawalValues(
      toPassbook,
      transaction.amount,
      isRevert
    );
    Object.assign(values, withdrawalValues);
  }

  // Apply transaction settings
  const settings = transactionPassbookSettings[transaction.transactionType];
  if (!settings) {
    return passbookToUpdate;
  }

  for (const [role, action] of Object.entries(settings) as [
    PassbookRole,
    PassbookConfigAction[PassbookRole],
  ][]) {
    if (!action) continue;

    const passbookId = passbookRoles[role];
    const currentPassbook = passbookToUpdate.get(passbookId);
    if (!currentPassbook) continue;

    // Reverse ADD/SUB for revert operations
    const effectiveAction = isRevert
      ? { ADD: action.SUB, SUB: action.ADD }
      : action;

    const updatedPassbook = buildPassbookUpdateQuery(
      currentPassbook,
      values,
      effectiveAction
    );

    passbookToUpdate.set(passbookId, updatedPassbook);
  }

  return passbookToUpdate;
}

/**
 * Handles a transaction entry by updating related passbooks
 * @param transaction - Transaction to process
 * @param isDelete - Whether this is a delete/revert operation (defaults to false)
 * @returns Promise resolving to bulk update result
 */
export async function transactionEntryHandler(
  transaction: Transaction,
  isDelete = false
) {
  const passbooks = await getTransactionPassbooks(transaction);
  const passbookToUpdate = initializePassbookToUpdate(passbooks, false);

  updatePassbookByTransaction(passbookToUpdate, transaction, isDelete);

  // Note: loanHistory is now calculated dynamically from transactions,
  // so we don't need to update it here. The passbook payload (totalLoanTaken,
  // totalLoanRepay, etc.) is still updated by updatePassbookByTransaction above.

  return bulkPassbookUpdate(passbookToUpdate);
}
