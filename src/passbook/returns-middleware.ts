import prisma from "@/db";

function getProfitSharesVendorsAndClub() {
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
      where: {
        type: "CLUB",
      },
      select: {
        id: true,
      },
    }),
  ]);
}

function returnsOffsetMembersCount({
  profitShares,
}: Awaited<ReturnType<typeof getProfitSharesVendorsAndClub>>[0][0]) {
  return {
    includedCount: profitShares
      .filter((e) => e.active)
      .map((e) => ({
        memberId: e.memberId,
        passbookId: e.member.passbook.id,
      })).length,
    excludedCount: profitShares
      .filter((e) => !e.active && e.member.active)
      .map((e) => ({
        memberId: e.memberId,
        passbookId: e.member.passbook.id,
      })).length,
  };
}

export async function calculateReturnsHandler() {
  const [vendors, club] = await getProfitSharesVendorsAndClub();
  const toUpdate: Map<string, any> = new Map();
  let totalOffset = 0;
  let totalReturns = 0;

  vendors.forEach((vendor) => {
    const { profitShares, passbook, type } = vendor;

    const { includedCount, excludedCount } = returnsOffsetMembersCount(vendor);

    let returns = Math.abs(Math.round(passbook.out - passbook.in));
    let memberShare = Math.abs(Math.round(returns / includedCount)) || 0;

    if (type === "LEND" && !passbook.calcReturns) {
      returns = Math.abs(Math.round(passbook.out));
      memberShare = Math.abs(Math.round(passbook.out / includedCount)) || 0;
    }

    if (!toUpdate.has(passbook.id)) {
      toUpdate.set(passbook.id, {
        offset: 0,
        returns: 0,
      });
    }

    if (passbook.calcReturns || type === "LEND") {
      const vendorOffset = Math.round(memberShare * excludedCount) || 0;

      totalOffset = totalOffset + vendorOffset;
      totalReturns = totalReturns + returns;

      toUpdate.set(passbook.id, {
        offset: vendorOffset,
        returns: returns,
      });
    }
    for (let { member, active } of profitShares) {
      const memberPassbookId = member.passbook.id;

      if (!toUpdate.has(memberPassbookId)) {
        toUpdate.set(memberPassbookId, {
          offset: 0,
          returns: 0,
        });
      }

      if (passbook.calcReturns || type === "LEND") {
        const memberPassbookEntry = toUpdate.get(memberPassbookId);

        if (active) {
          toUpdate.set(memberPassbookId, {
            ...memberPassbookEntry,
            returns: memberPassbookEntry.returns + memberShare,
          });
        } else {
          toUpdate.set(memberPassbookId, {
            ...memberPassbookEntry,
            offset: memberPassbookEntry.offset + memberShare,
          });
        }
      }
    }
  });

  const passbooksData = Array.from(toUpdate, ([id, data]) => ({
    where: { id },
    data,
  }));

  const passbooksUpdate = passbooksData.map((each) =>
    prisma.passbook.update(each)
  );

  if (club?.id) {
    passbooksUpdate.push(
      prisma.passbook.update({
        where: {
          id: club?.id,
        },
        data: {
          offset: totalOffset,
          returns: totalReturns,
        },
      })
    );
  }

  await prisma.$transaction(passbooksUpdate);

  return {
    totalOffset,
    passbooksData,
  };
}
