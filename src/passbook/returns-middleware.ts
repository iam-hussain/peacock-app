import prisma from "@/db";

// Function to fetch profit shares, vendors, and club data
async function getProfitSharesVendorsAndClub() {
  return Promise.all([
    prisma.vendor.findMany({
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
                  select: {
                    id: true,
                  },
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
    }),
    prisma.passbook.findFirst({
      where: { type: "CLUB" },
      select: { id: true },
    }),
  ]);
}

// Function to calculate included and excluded members counts
function calculateMembersCount({ profitShares }: { profitShares: any[] }) {
  const includedCount = profitShares.filter((e) => e.active).length;
  const excludedCount = profitShares.filter(
    (e) => !e.active && e.member.active,
  ).length;

  return { includedCount, excludedCount };
}

// Main function to handle return calculations
export async function calculateReturnsHandler() {
  const [vendors, club] = await getProfitSharesVendorsAndClub();
  const toUpdate = new Map<string, { offset: number; returns: number }>();
  let totalOffset = 0;
  let totalReturns = 0;

  vendors.forEach(({ profitShares, passbook, type }) => {
    const { includedCount, excludedCount } = calculateMembersCount({
      profitShares,
    });

    let returns = Math.abs(passbook.out - passbook.in);
    let memberShare = includedCount
      ? Math.abs(Math.round(returns / includedCount))
      : 0;

    if (type === "LEND" && !passbook.calcReturns) {
      returns = Math.abs(passbook.out);
      memberShare = includedCount
        ? Math.abs(Math.round(passbook.out / includedCount))
        : 0;
    }

    const currentPassbook = toUpdate.get(passbook.id) || {
      offset: 0,
      returns: 0,
    };

    if (passbook.calcReturns || type === "LEND") {
      const vendorOffset = Math.round(memberShare * excludedCount) || 0;

      totalOffset += vendorOffset;
      totalReturns += returns;

      toUpdate.set(passbook.id, {
        offset: currentPassbook.offset + vendorOffset,
        returns: currentPassbook.returns + returns,
      });
    }

    profitShares.forEach(({ member, active }) => {
      const memberPassbookId = member.passbook.id;
      const memberPassbookEntry = toUpdate.get(memberPassbookId) || {
        offset: 0,
        returns: 0,
      };

      if (passbook.calcReturns || type === "LEND") {
        toUpdate.set(memberPassbookId, {
          offset: memberPassbookEntry.offset + (active ? 0 : memberShare),
          returns: memberPassbookEntry.returns + (active ? memberShare : 0),
        });
      }
    });
  });

  const passbooksUpdate = Array.from(toUpdate.entries()).map(([id, data]) =>
    prisma.passbook.update({ where: { id }, data }),
  );

  console.log(JSON.stringify({ passbooks: Array.from(toUpdate.entries()).map(([id, data]) =>
    ({ where: { id }, data }),
  ), totalOffset, totalReturns  }))

  if (club?.id) {
    passbooksUpdate.push(
      prisma.passbook.update({
        where: { id: club.id },
        data: { offset: totalOffset, returns: totalReturns },
      }),
    );
  }

  await prisma.$transaction(passbooksUpdate);

  return { totalReturns, totalOffset, passbooksData: Array.from(toUpdate) };
}
