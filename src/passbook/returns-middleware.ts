import prisma from "@/db";

function getProfitSharesVendorsAndClub() {
  return Promise.all([
    prisma.vendor.findMany({
      select: {
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
    includeCount: profitShares
      .filter((e) => e.active)
      .map((e) => ({
        memberId: e.memberId,
        passbookId: e.member.passbook.id,
      })).length,
    activeExcludeCount: profitShares
      .filter((e) => !e.active && !e.member.active)
      .map((e) => ({
        memberId: e.memberId,
        passbookId: e.member.passbook.id,
      })).length,
  };
}

export async function calculateReturnsHandler() {
  const [vendors, club] = await getProfitSharesVendorsAndClub();

  const passbooks: Map<string, any> = new Map();

  let overallExcludeTallyAmount = 0;

  for (let vendor of vendors) {
    const { profitShares, passbook } = vendor;

    if (!passbook.calcReturns) {
      return;
    }
    const { includeCount, activeExcludeCount } =
      returnsOffsetMembersCount(vendor);

    const eachMemberProfit =
      Math.round((passbook.in - passbook.out) / includeCount) || 0;
    const excludeTallyAmount =
      Math.round(eachMemberProfit * activeExcludeCount) || 0;

    overallExcludeTallyAmount = overallExcludeTallyAmount + excludeTallyAmount;

    for (let { member, active } of profitShares) {
      const memberPassbookId = member.passbook.id;

      if (!passbooks.has(memberPassbookId)) {
        passbooks.set(memberPassbookId, {
          offset: 0,
          returns: 0,
        });
      }

      const memberPassbookEntry = passbooks.get(memberPassbookId);

      if (active) {
        passbooks.set(memberPassbookId, {
          ...memberPassbookEntry,
          returns: memberPassbookEntry.returns + eachMemberProfit,
        });
      } else {
        passbooks.set(memberPassbookId, {
          ...memberPassbookEntry,
          offset: memberPassbookEntry.offset + eachMemberProfit,
        });
      }
    }
  }
  console.log(
    JSON.stringify({
      transactionData: Array.from(passbooks),
      overallExcludeTallyAmount,
    })
  );

  const transactionData = Array.from(passbooks, ([id, data]) => ({
    where: { id },
    data,
  })).map((each) => prisma.passbook.update(each));

  if (club?.id) {
    transactionData.push(
      prisma.passbook.update({
        where: {
          id: club?.id,
        },
        data: {
          offset: overallExcludeTallyAmount,
        },
      })
    );
  }

  await prisma.$transaction(transactionData);

  return;
}
