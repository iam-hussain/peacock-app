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
          type: true,
        },
      },
    },
  });

  const result = {
    MEMBER: passbooks.find((e) => e?.member?.id === memberId),
    VENDOR: passbooks.find((e) => e?.vendor?.id === vendorId),
    CLUB: passbooks.find((e) => e.type === "CLUB"),
  };

  // Check if all values exist, otherwise return false
  if (result.MEMBER && result.VENDOR && result.CLUB) {
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

  if (
    created.transactionType &&
    [TRANSACTION_TYPE.RETURNS, TRANSACTION_TYPE.PROFIT].includes(
      created?.transactionType as any
    )
  ) {
    const vendors = await fetchProfitSharesVendors();
    passbookToUpdate = await transactionConnectionMiddleware(
      passbookToUpdate,
      vendors,
      transactionPassbooks.CLUB as Passbook
    );
  }

  if (transactionPassbooks.VENDOR?.vendor?.type === "LEND") {
    passbookToUpdate = await updateLoanMiddleware(
      passbookToUpdate,
      transactionPassbooks.VENDOR?.vendor.id
    );
  }

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
