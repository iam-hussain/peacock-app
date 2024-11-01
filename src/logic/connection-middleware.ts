import prisma from "@/db";

type PassbookToUpdate = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;

// Function to fetch profit shares, vendors, and club data
export async function fetchProfitSharesVendors() {
  return prisma.vendor.findMany({
    select: {
      type: true,
      profitShares: {
        select: {
          id: true,
          memberId: true,
          vendorId: true,
          active: true,
          member: {
            select: {
              active: true,
              passbook: {
                select: { id: true },
              },
            },
          },
        },
      },
      passbook: {
        select: {
          id: true,
          returns: true,
          calcReturns: true,
          in: true,
          out: true,
        },
      },
    },
    where: { type: { notIn: ["HOLD", "LEND"] } },
  });
}

type FetchedItems = Awaited<ReturnType<typeof fetchProfitSharesVendorsAndClub>>;

// Function to fetch profit shares, vendors, and club data
async function fetchProfitSharesVendorsAndClub() {
  return Promise.all([
    fetchProfitSharesVendors(),
    prisma.passbook.findFirst({
      where: { type: "CLUB" },
      select: { id: true },
    }),
  ]);
}

type ProfitShare = {
  member: {
    passbook: {
      id: string;
    };
    active: boolean;
  };
  id: string;
  vendorId: string;
  memberId: string;
  active: boolean;
};

// Calculate counts of included and excluded members
function countMembers(profitShares: ProfitShare[]) {
  const includedCount = profitShares.filter(({ active }) => active).length;
  const excludedCount = profitShares.filter(
    ({ active, member }) => !active && member.active
  ).length;
  return { includedCount, excludedCount };
}

function calculatedVendorsConnection(vendors: FetchedItems[0]) {
  const toUpdate = new Map<string, { offset: number; returns: number }>();
  let totalOffset = 0;
  let totalReturns = 0;

  vendors.forEach(({ profitShares, passbook }) => {
    const { includedCount, excludedCount } = countMembers(profitShares);
    const returns = Math.abs(passbook.out - passbook.in);
    const memberShare =
      includedCount > 0 ? Math.round(returns / includedCount) : 0;

    const passbookData = toUpdate.get(passbook.id) || { offset: 0, returns: 0 };
    if (passbook.calcReturns) {
      const vendorOffset = Math.round(memberShare * excludedCount) || 0;
      totalOffset += vendorOffset;
      totalReturns += returns;

      toUpdate.set(passbook.id, {
        offset: passbookData.offset + vendorOffset,
        returns: passbookData.returns + returns,
      });
    }

    profitShares.forEach(({ member, active }) => {
      const memberPassbookId = member.passbook.id;
      const memberPassbookData = toUpdate.get(memberPassbookId) || {
        offset: 0,
        returns: 0,
      };

      if (passbook.calcReturns) {
        toUpdate.set(memberPassbookId, {
          offset: memberPassbookData.offset + (active ? 0 : memberShare),
          returns: memberPassbookData.returns + (active ? memberShare : 0),
        });
      }
    });
  });
  return {
    toUpdate,
    totalOffset,
    totalReturns,
  };
}

// Main handler function for return calculations
export async function connectionMiddleware() {
  const [vendors, club] = await fetchProfitSharesVendorsAndClub();
  let passbookToUpdate: PassbookToUpdate = new Map();

  if (!club) {
    return passbookToUpdate;
  }
  passbookToUpdate = await transactionConnectionMiddleware(
    passbookToUpdate,
    vendors,
    club
  );

  return passbookToUpdate;
}

export async function transactionConnectionMiddleware(
  passbookToUpdate: PassbookToUpdate,
  vendors: Awaited<ReturnType<typeof fetchProfitSharesVendors>>,
  clubPassbook: { id: string }
) {
  const { toUpdate, totalOffset, totalReturns } =
    calculatedVendorsConnection(vendors);

  Array.from(toUpdate.entries()).forEach(([id, data]) => {
    const item = passbookToUpdate.get(id) || { where: { id }, data: {} };
    passbookToUpdate.set(id, {
      ...item,
      data: {
        ...item.data,
        offset: (Number(item.data?.offset) || 0) + data.offset,
        returns: (Number(item.data?.returns) || 0) + data.returns,
      },
    });
  });
  const club = passbookToUpdate.get(clubPassbook.id) || {
    where: { id: clubPassbook.id },
    data: {},
  };
  passbookToUpdate.set(clubPassbook.id, {
    ...club,
    data: {
      ...club.data,
      offset: (Number(club.data?.offset) || 0) + totalOffset,
      returns: (Number(club.data?.returns) || 0) + totalReturns,
    },
  });

  return passbookToUpdate;
}
