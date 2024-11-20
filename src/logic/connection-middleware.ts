/* eslint-disable unused-imports/no-unused-vars */
import prisma from "@/db";
import {
  fetchAllPassbook,
  initializePassbookToUpdate,
  setPassbookUpdateQuery,
} from "@/lib/helper";
import { PassbookToUpdate, VendorPassbookData } from "@/lib/type";

// Function to fetch profit shares, vendors, and club data
export async function fetchAllProfitShares() {
  return prisma.profitShare.findMany({
    select: {
      id: true,
      memberId: true,
      vendorId: true,
      active: true,
      member: {
        select: {
          active: true,
        },
      },
    },
  });
}

type FetchedProfitShares = Awaited<ReturnType<typeof fetchAllProfitShares>>;

// Calculate counts of included and excluded members
function countMembers(profitShares: FetchedProfitShares) {
  const includedMembersCount = profitShares.filter(
    ({ active }) => active
  ).length;
  const excludedMembersCount = profitShares.filter(
    ({ active, member }) => !active && member.active
  ).length;
  return { includedMembersCount, excludedMembersCount };
}

export function calculatedVendorsConnection(
  passbookToUpdate: PassbookToUpdate,
  profitShare: FetchedProfitShares
) {
  const vendorGroup: { [key in string]: FetchedProfitShares } = {};

  profitShare.forEach((each) => {
    if (!vendorGroup[each.vendorId]) {
      vendorGroup[each.vendorId] = [];
    }

    vendorGroup[each.vendorId].push(each);
  });

  let clubTotalVendorProfit = 0;
  let clubTotalVendorOffsetAmount = 0;
  let memberTotalVendorOffsetAmount: { [key in string]: number } = {};

  Object.entries(vendorGroup).forEach(([vendorId, each]) => {
    const vendorPassbook = passbookToUpdate.get(vendorId);

    if (vendorPassbook) {
      const { totalInvestment, totalReturns } = vendorPassbook.data
        .payload as VendorPassbookData;

      const totalReturnAmount =
        totalInvestment > 0 ? totalReturns - totalInvestment : totalReturns;

      const totalProfitAmount = totalReturnAmount > 0 ? totalReturnAmount : 0;

      const { includedMembersCount, excludedMembersCount } = countMembers(each);

      const memberProfitAmount =
        totalProfitAmount > 0 && includedMembersCount > 0
          ? Math.round(totalReturnAmount / includedMembersCount)
          : 0;
      const totalVendorOffsetAmount =
        totalProfitAmount > 0 && excludedMembersCount > 0
          ? Math.round(memberProfitAmount / excludedMembersCount)
          : 0;

      clubTotalVendorProfit = clubTotalVendorProfit + totalProfitAmount;
      clubTotalVendorOffsetAmount =
        clubTotalVendorOffsetAmount + totalVendorOffsetAmount;

      passbookToUpdate.set(
        vendorId,
        setPassbookUpdateQuery(vendorPassbook, {
          totalProfitAmount: totalProfitAmount,
          totalOffsetAmount: totalVendorOffsetAmount,
          includedMembersCount,
          excludedMembersCount,
          memberProfitAmount,
        })
      );

      each.forEach(({ memberId, member: { active = false } }) => {
        if (!memberTotalVendorOffsetAmount[memberId]) {
          memberTotalVendorOffsetAmount[memberId] = 0;
        }

        if (!active) {
          memberTotalVendorOffsetAmount[memberId] =
            memberTotalVendorOffsetAmount[memberId] + memberProfitAmount;
        }
      });
    }
  });

  Object.entries(memberTotalVendorOffsetAmount).forEach(([memberId, value]) => {
    const memberPassbook = passbookToUpdate.get(memberId);

    if (memberPassbook) {
      passbookToUpdate.set(
        memberId,
        setPassbookUpdateQuery(memberPassbook, {
          totalVendorOffsetAmount: value,
        })
      );
    }
  });
  const clubPassbook = passbookToUpdate.get("CLUB");

  if (clubPassbook) {
    passbookToUpdate.set(
      "CLUB",
      setPassbookUpdateQuery(clubPassbook, {
        totalVendorProfit: clubTotalVendorProfit,
        totalVendorOffsetAmount: clubTotalVendorOffsetAmount,
      })
    );
  }

  return passbookToUpdate;
}

// Main handler function for return calculations
export async function connectionMiddleware() {
  const [passbooks, profitShare] = await Promise.all([
    fetchAllPassbook(),
    fetchAllProfitShares(),
  ]);

  let passbookToUpdate = initializePassbookToUpdate(passbooks);

  return calculatedVendorsConnection(passbookToUpdate, profitShare);
}
