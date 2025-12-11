import prisma from "@/db";
import {
  initializePassbookToUpdate,
  setPassbookUpdateQuery,
} from "@/lib/helper";
import { PassbookToUpdate, VendorPassbookData } from "@/lib/type";

/**
 * Fetches all vendor and club passbooks
 * @returns Array of passbooks with their account relationships
 */
function getVendorAndClubPassbooks() {
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
}

/**
 * Calculates vendor profit and updates passbooks accordingly
 * @param passbookToUpdate - Map of passbooks to update
 * @param vendorIds - Array of vendor account IDs to process
 * @returns Updated passbook map with calculated profits
 */
export function calculateVendorProfits(
  passbookToUpdate: PassbookToUpdate,
  vendorIds: string[]
): PassbookToUpdate {
  let totalVendorProfit = 0;

  for (const vendorId of vendorIds) {
    const vendorPassbook = passbookToUpdate.get(vendorId);
    if (!vendorPassbook) continue;

    const payload = vendorPassbook.data?.payload as VendorPassbookData;
    const { totalInvestment = 0, totalReturns = 0 } = payload;

    const profitAmount = Math.max(totalReturns - totalInvestment, 0);

    passbookToUpdate.set(
      vendorId,
      setPassbookUpdateQuery(vendorPassbook, {
        totalProfitAmount: profitAmount,
      })
    );

    totalVendorProfit += profitAmount;
  }

  // Update club passbook with total vendor profit
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

/**
 * Main handler for vendor profit calculations
 * Fetches vendor passbooks and calculates profits for all vendors
 * @returns Map of updated passbooks ready for bulk update
 */
export async function vendorMiddlewareHandler(): Promise<PassbookToUpdate> {
  const passbooks = await getVendorAndClubPassbooks();
  const passbookToUpdate = initializePassbookToUpdate(passbooks, false);

  const vendorIds = passbooks
    .filter((pb) => pb.type === "VENDOR")
    .map((pb) => pb.id);

  return calculateVendorProfits(passbookToUpdate, vendorIds);
}
