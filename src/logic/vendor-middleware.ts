/* eslint-disable unused-imports/no-unused-vars */

import prisma from "@/db";
import {
  initializePassbookToUpdate,
  setPassbookUpdateQuery,
} from "@/lib/helper";
import { PassbookToUpdate, VendorPassbookData } from '@/lib/validators/type';

const getVendorsPassbook = () => {
  return prisma.passbook.findMany({
    where: {
      type: { in: ["CLUB", "VENDOR"] },
    },
    select: {
      id: true,
      type: true,
      payload: true,
      account: {
        select: {
          id: true,
        },
      },
    },
  });
};

export function vendorCalcHandler(
  passbookToUpdate: PassbookToUpdate,
  ids: string[]
) {
  let totalVendorProfit = 0;
  ids.forEach((each) => {
    const vendor = passbookToUpdate.get(each);
    if (vendor) {
      const { totalInvestment = 0, totalReturns = 0 } = vendor.data
        .payload as VendorPassbookData;
      const totalProfitAmount = Math.max(totalReturns - totalInvestment, 0);
      passbookToUpdate.set(
        each,
        setPassbookUpdateQuery(vendor, { totalProfitAmount })
      );
      totalVendorProfit = totalVendorProfit + totalProfitAmount;
    }
  });
  const clubPassbook = passbookToUpdate.get("CLUB");
  if (clubPassbook) {
    passbookToUpdate.set(
      "CLUB",
      setPassbookUpdateQuery(clubPassbook, {
        totalVendorProfit,
      })
    );
  }

  return passbookToUpdate;
}

export async function vendorMiddlewareHandler() {
  const passbooks = await getVendorsPassbook();
  let passbookToUpdate = initializePassbookToUpdate(passbooks, false);
  passbookToUpdate = vendorCalcHandler(
    passbookToUpdate,
    passbooks.filter((e) => e.type === "VENDOR").map((e) => e.id)
  );
  return passbookToUpdate;
}
