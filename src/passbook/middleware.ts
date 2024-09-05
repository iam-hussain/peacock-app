import { MemberTransaction, Passbook, VendorTransaction } from "@prisma/client";

import {
  memberTransactionPassbookSettings,
  PassbookConfigAction,
  PassbookConfigActionValue,
  vendorTransactionPassbookSettings,
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

const getMemberTractionPassbook = async ({
  fromId,
  toId,
}: MemberTransaction) => {
  const passbooks = await prisma.passbook.findMany({
    where: {
      OR: [
        {
          member: {
            id: { in: [fromId, toId] },
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
    },
  });

  const result = {
    FROM: passbooks.find((e) => e.member?.id === fromId) as Passbook,
    TO: passbooks.find((e) => e.member?.id === toId) as Passbook,
    CLUB: passbooks.find((e) => e.type === "CLUB") as Passbook,
  };

  // Check if all values exist, otherwise return false
  if (result.FROM && result.TO && result.CLUB) {
    return result;
  } else {
    return false;
  }
};

export const handleMemberPassbookEntry = async (
  transaction: MemberTransaction,
  isRevert: Boolean = false
) => {
  const passbookToUpdate: Parameters<typeof prisma.passbook.update>[0][] = [];

  const passbooks = await getMemberTractionPassbook(transaction);
  if (!passbooks) {
    return;
  }

  const values: PassbookConfigActionValueObj = {
    amount: transaction.amount,
    term:
      calculateMonthsPaid(passbooks.FROM.balance + transaction.amount) -
      passbooks.FROM.currentTerm,
  };

  Object.entries(memberTransactionPassbookSettings).forEach(
    ([transactionType, passbooksOf]) => {
      if (transaction.transactionType === transactionType) {
        Object.entries(passbooksOf).forEach(([passbookOf, action]: any[]) => {
          const currentPassbook =
            passbooks[passbookOf as "FROM" | "TO" | "CLUB"];
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

const getVendorTractionPassbook = async ({
  memberId,
  vendorId,
}: VendorTransaction) => {
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
    MEMBER: passbooks.find((e) => e.type === "MEMBER") as Passbook,
    VENDOR: passbooks.find((e) => e.type === "VENDOR") as Passbook,
    CLUB: passbooks.find((e) => e.type === "CLUB") as Passbook,
  };

  // Check if all values exist, otherwise return false
  if (result.MEMBER && result.VENDOR && result.CLUB) {
    return result;
  } else {
    return false;
  }
};

export const handleVendorPassbookEntry = async (
  transaction: VendorTransaction,
  isRevert: Boolean = false
) => {
  const passbookToUpdate: Parameters<typeof prisma.passbook.update>[0][] = [];

  const passbooks = await getVendorTractionPassbook(transaction);
  if (!passbooks) {
    return;
  }

  const values: PassbookConfigActionValueObj = {
    amount: transaction.amount,
    term: 1,
  };

  Object.entries(vendorTransactionPassbookSettings).forEach(
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
