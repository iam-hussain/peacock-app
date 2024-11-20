import { Transaction } from "@prisma/client";

import {
  PassbookConfigAction,
  PassbookConfigActionValue,
  transactionPassbookSettings,
} from "./settings";

import prisma from "@/db";
import { setPassbookUpdateQuery } from "@/lib/helper";

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
  const values: PassbookConfigActionValueMap = {
    AMOUNT: transaction.amount,
  };

  const transactionPassbooks: any = {
    FROM: transaction.fromId,
    TO: transaction.toId,
    CLUB: "CLUB",
  };

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
