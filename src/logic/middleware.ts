import { Passbook, Transaction, TRANSACTION_TYPE } from "@prisma/client";

import {
  fetchProfitSharesVendors,
  transactionConnectionMiddleware,
} from "./connection-middleware";
import { updateLoanMiddleware } from "./loan-middleware";
import { transactionMiddleware } from "./transaction-middleware";

import prisma from "@/db";
import { bulkPassbookUpdate } from "@/lib/helper";

type PassbookToUpdate = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;

const getTractionPassbook = async ({ fromId, toId }: Transaction) => {
  const passbooks = await prisma.passbook.findMany({
    where: {
      OR: [
        {
          account: {
            id: { in: [fromId, toId] },
          },
        },
        { type: "CLUB" },
      ],
    },
    include: {
      account: {
        select: {
          id: true,
          isMember: true,
        },
      },
    },
  });

  const result = {
    FROM: passbooks.find((e) => e?.account?.id === fromId),
    TO: passbooks.find((e) => e?.account?.id === toId),
    CLUB: passbooks.find((e) => e.type === "CLUB"),
  };

  // Check if all values exist, otherwise return false
  if (result.FROM && result.TO && result.CLUB) {
    return result;
  } else {
    return false;
  }
};

export async function transactionMiddlewareHandler(
  created: Transaction,
  isDelete: boolean = false
) {
  const transactionPassbooks = await getTractionPassbook(created);

  if (typeof transactionPassbooks === "boolean") {
    return new Map();
  }

  let passbookToUpdate = await transactionMiddleware(
    new Map(),
    created as Transaction,
    transactionPassbooks as any,
    isDelete
  );

  // if (
  //   created.transactionType &&
  //   [TRANSACTION_TYPE.RETURNS, TRANSACTION_TYPE.PROFIT].includes(
  //     created?.transactionType as any
  //   )
  // ) {
  //   const vendors = await fetchProfitSharesVendors();
  //   passbookToUpdate = await transactionConnectionMiddleware(
  //     passbookToUpdate,
  //     vendors,
  //     transactionPassbooks.CLUB as Passbook
  //   );
  // }

  // if (transactionPassbooks.VENDOR?.vendor?.type === "LEND") {
  //   passbookToUpdate = await updateLoanMiddleware(
  //     passbookToUpdate,
  //     transactionPassbooks.VENDOR?.vendor.id
  //   );
  // }

  return bulkPassbookUpdate(passbookToUpdate);
}

export async function seedTransactionMiddlewareHandler(
  created: Transaction,
  isDelete: boolean = false
) {
  const transactionPassbooks = await getTractionPassbook(created);

  if (typeof transactionPassbooks === "boolean") {
    return new Map();
  }

  const passbookToUpdate = await transactionMiddleware(
    new Map(),
    created as Transaction,
    transactionPassbooks as any,
    isDelete
  );

  return bulkPassbookUpdate(passbookToUpdate);
}
