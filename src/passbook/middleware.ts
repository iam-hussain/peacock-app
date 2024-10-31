import { Passbook, Transaction } from "@prisma/client";

import {
  PassbookConfigAction,
  PassbookConfigActionValue,
  transactionPassbookSettings,
} from "./settings";

import prisma from "@/db";
import { calculateMonthsPaid } from "@/lib/club";

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

const getTractionPassbook = async ({ memberId, vendorId }: Transaction) => {
  const passbooks = await prisma.passbook.findMany({
    where: {
      OR: [
        {
          member: {
            id: memberId,
          },
        },
        {
          vendor: {
            id: vendorId,
          },
        },
        { type: "CLUB" },
      ],
    },
    include: {
      member: {
        select: {
          id: true,
        },
      },
      vendor: {
        select: {
          id: true,
        },
      },
    },
  });

  const result = {
    MEMBER: passbooks.find((e) => e?.member?.id === memberId) as Passbook,
    VENDOR: passbooks.find((e) => e?.vendor?.id === vendorId) as Passbook,
    CLUB: passbooks.find((e) => e.type === "CLUB") as Passbook,
  };

  // Check if all values exist, otherwise return false
  if (result.MEMBER && result.VENDOR && result.CLUB) {
    return result;
  } else {
    return false;
  }
};

export const handlePassbookEntry = async (
  transaction: Transaction,
  isRevert: Boolean = false
) => {
  const passbookToUpdate: Parameters<typeof prisma.passbook.update>[0][] = [];

  const passbooks = await getTractionPassbook(transaction);
  if (!passbooks) {
    return;
  }

  const values: PassbookConfigActionValueObj = {
    amount: transaction.amount,
    term: 1,
  };

  if (transaction.transactionType === "PERIODIC_DEPOSIT") {
    values.term =
      calculateMonthsPaid(passbooks.MEMBER.balance + transaction.amount) -
      passbooks.MEMBER.currentTerm;
  }

  Object.entries(transactionPassbookSettings).forEach(
    ([transactionType, passbooksOf]) => {
      if (transaction.transactionType === transactionType) {
        Object.entries(passbooksOf).forEach(([passbookOf, action]: any[]) => {
          const currentPassbook =
            passbooks[passbookOf as "MEMBER" | "VENDOR" | "CLUB"];
          if (currentPassbook) {
            if (isRevert) {
              passbookToUpdate.push(
                getPassbookUpdateQuery(currentPassbook, values, {
                  ADD: action.SUB || {},
                  SUB: action.ADD || {},
                } as PassbookConfigAction)
              );
            } else {
              passbookToUpdate.push(
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

  await prisma.$transaction(passbookToUpdate.map(prisma.passbook.update));
};
