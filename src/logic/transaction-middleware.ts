import { Transaction } from "@prisma/client";

import {
  PassbookConfigAction,
  PassbookConfigActionValue,
  transactionPassbookSettings,
} from "./settings";

import prisma from "@/db";
import { setPassbookUpdateQuery } from "@/lib/helper";
import { MemberPassbookData } from "@/lib/type";

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
  });
}

type PassbookToUpdate = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;

export const transactionMiddleware = (
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
  };

  if (transaction.transactionType === "WITHDRAW" && !isRevert) {
    const toPassbook = passbookToUpdate.get(transaction.toId);
    if (toPassbook) {
      const { periodicDepositAmount = 0, withdrawalAmount = 0 } = (toPassbook
        .data.payload || {}) as MemberPassbookData;
      const totalWithdrawalAmount = withdrawalAmount + transaction.amount;
      const totalWithdrawalProfit =
        totalWithdrawalAmount > periodicDepositAmount
          ? totalWithdrawalAmount - periodicDepositAmount
          : 0;
      values.DEPOSIT_DIFF = totalWithdrawalProfit;
      values.AMOUNT = transaction.amount - totalWithdrawalProfit;
    }
  }

  if (transaction.transactionType === "WITHDRAW") {
    const toPassbook = passbookToUpdate.get(transaction.toId);
    if (toPassbook) {
      const {
        periodicDepositAmount = 0,
        withdrawalAmount = 0,
        profitWithdrawalAmount = 0,
      } = (toPassbook.data.payload || {}) as MemberPassbookData;

      if (!isRevert) {
        const totalWithdrawalAmount = withdrawalAmount + transaction.amount;
        const totalWithdrawalProfit =
          totalWithdrawalAmount > periodicDepositAmount
            ? totalWithdrawalAmount - periodicDepositAmount
            : 0;
        values.DEPOSIT_DIFF = totalWithdrawalProfit;
        values.AMOUNT = transaction.amount - totalWithdrawalProfit;
      } else {
        // Revert case
        values.DEPOSIT_DIFF =
          transaction.amount > profitWithdrawalAmount
            ? profitWithdrawalAmount
            : transaction.amount;
        values.AMOUNT =
          transaction.amount > profitWithdrawalAmount
            ? Math.max(transaction.amount - profitWithdrawalAmount, 0)
            : 0;
      }
    }
  }

  Object.entries(transactionPassbookSettings).forEach(
    ([transactionType, passbooksOf]) => {
      if (transaction.transactionType === transactionType) {
        Object.entries(passbooksOf).forEach(([passbookOf, action]: any[]) => {
          const currentPassbook = passbookToUpdate.get(
            transactionPassbooks[passbookOf]
          );
          if (currentPassbook) {
            let currentAction = action;
            if (isRevert) {
              currentAction = {
                ADD: action.SUB,
                SUB: action.ADD,
              };
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
