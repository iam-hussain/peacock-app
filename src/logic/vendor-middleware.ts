import { PassbookToUpdate } from "@/lib/validators/type";
import { VendorPassbookData } from "@/lib/validators/type";

/**
 * Calculate vendor profits and update vendor passbooks
 * @param passbookToUpdate - Map of passbook updates
 * @param vendorIds - Array of vendor account IDs
 * @returns Updated passbook map with vendor calculations
 */
export function vendorCalcHandler(
  passbookToUpdate: PassbookToUpdate,
  vendorIds: string[]
): PassbookToUpdate {
  for (const vendorId of vendorIds) {
    const vendorPassbook = passbookToUpdate.get(vendorId);
    if (!vendorPassbook || vendorPassbook.data.kind !== "VENDOR") {
      continue;
    }

    const payload = vendorPassbook.data.payload as VendorPassbookData;
    const totalInvestment = payload.totalInvestment || 0;
    const totalReturns = payload.totalReturns || 0;

    // Vendor profit is calculated as returns - investment
    const totalProfit = Math.max(totalReturns - totalInvestment, 0);

    // Update the payload with calculated profit
    passbookToUpdate.set(vendorId, {
      ...vendorPassbook,
      data: {
        ...vendorPassbook.data,
        payload: {
          ...payload,
          totalProfit,
        },
      },
    });
  }

  return passbookToUpdate;
}
