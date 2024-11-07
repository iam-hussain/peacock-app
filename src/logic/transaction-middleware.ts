import { Passbook, Transaction } from "@prisma/client";

import {
  PassbookConfigAction,
  PassbookConfigActionValue,
  transactionPassbookSettings,
} from "./settings";

import prisma from "@/db";

type PassbookConfigActionValueMap = {
  [key in PassbookConfigActionValue]: number;
};

function getPassbookUpdateQuery(
  passbook: Passbook,
  values: PassbookConfigActionValueMap,
  action: PassbookConfigAction['CLUB'] | PassbookConfigAction['FROM'] | PassbookConfigAction['TO'],
  addonData: Parameters<typeof prisma.passbook.update>[0]["data"] = {}
): Parameters<typeof prisma.passbook.update>[0] {
  return {
    where: {
      id: passbook.id,
    },
    data: {
      ...addonData,
      ...Object.fromEntries(
        Object.entries(action.ADD || {}).map(([key, value]) => [
          key,
          Number(passbook[key as keyof Passbook] || 0) + values[value],
        ])
      ),
      ...Object.fromEntries(
        Object.entries(action.SUB || {}).map(([key, value]) => [
          key,
          Number(passbook[key as keyof Passbook] || 0) - values[value],
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

  const values: PassbookConfigActionValueMap = {
    AMOUNT: transaction.amount,
    TERM: 1,
    PROFIT: 0
  };

  Object.entries(transactionPassbookSettings).forEach(
    ([transactionType, passbooksOf]) => {
      if (transaction.transactionType === transactionType) {
        Object.entries(passbooksOf).forEach(([passbookOf, action]: any[]) => {
          const currentPassbook =
            transactionPassbooks[passbookOf as "MEMBER" | "VENDOR" | "CLUB"];
          if (currentPassbook) {
            const passbookData = passbookToUpdate.get(currentPassbook.id) || {
              where: { id: currentPassbook.id },
              data: {},
            };
            if (isRevert) {
              passbookToUpdate.set(
                currentPassbook.id,
                getPassbookUpdateQuery(
                  currentPassbook,
                  values,
                  {
                    ADD: action.SUB,
                    SUB: action.ADD,
                  },
                  passbookData.data
                )
              );
            } else {
              passbookToUpdate.set(
                currentPassbook.id,
                getPassbookUpdateQuery(
                  currentPassbook,
                  values,
                  action,
                  passbookData.data
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
