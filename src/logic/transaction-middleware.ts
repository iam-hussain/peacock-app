import { Passbook, Transaction } from "@prisma/client";

import {
  PassbookConfigAction,
  PassbookConfigActionValue,
  transactionPassbookSettings,
} from "./settings";

import prisma from "@/db";

type PassbookConfigActionValueObj = {
  [key in PassbookConfigActionValue]: number;
};

function getPassbookUpdateQuery(
  passbook: Passbook,
  values: PassbookConfigActionValueObj,
  action: PassbookConfigAction
): Parameters<typeof prisma.passbook.update>[0] {
  return {
    where: {
      id: passbook.id,
    },
    data: {
      ...Object.fromEntries(
        Object.entries(action.ADD || {}).map(([key, value]) => [
          key,
          Number(passbook[key as keyof Passbook]) + values[value],
        ])
      ),
      ...Object.fromEntries(
        Object.entries(action.SUB || {}).map(([key, value]) => [
          key,
          Number(passbook[key as keyof Passbook]) - values[value],
        ])
      ),
    },
  };
}

type PassbookToUpdate = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;

export const transactionMiddleware = async (
  passbookToUpdate: PassbookToUpdate,
  transaction: Transaction,
  transactionPassbooks: { MEMBER: Passbook; VENDOR: Passbook; CLUB: Passbook },
  isRevert: Boolean = false
) => {
  const values: PassbookConfigActionValueObj = {
    amount: transaction.amount,
    term: 1,
  };

  Object.entries(transactionPassbookSettings).forEach(
    ([transactionType, passbooksOf]) => {
      if (transaction.transactionType === transactionType) {
        Object.entries(passbooksOf).forEach(([passbookOf, action]: any[]) => {
          const currentPassbook =
            transactionPassbooks[passbookOf as "MEMBER" | "VENDOR" | "CLUB"];
          if (currentPassbook) {
            if (isRevert) {
              passbookToUpdate.set(
                currentPassbook.id,
                getPassbookUpdateQuery(currentPassbook, values, {
                  ADD: action.SUB || {},
                  SUB: action.ADD || {},
                } as PassbookConfigAction)
              );
            } else {
              passbookToUpdate.set(
                currentPassbook.id,
                getPassbookUpdateQuery(
                  currentPassbook,
                  values,
                  action as PassbookConfigAction
                )
              );
            }
          }
        });
      }
    }
  );

  return passbookToUpdate;
};
