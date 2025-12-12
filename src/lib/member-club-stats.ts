import prisma from '@/db'
import { getMemberTotalDepositUpToday } from '@/lib/club'
import { getMemberLoanHistory } from '@/lib/loan-calculator'
import { ClubPassbookData, VendorPassbookData } from '@/lib/type'

export async function getMemberClubStats() {
  const [members, clubPassbook, vendorPassbooks] = await Promise.all([
    prisma.account.findMany({
      where: { isMember: true },
      include: { passbook: true },
    }),
    prisma.passbook.findFirstOrThrow({
      where: { type: "CLUB" },
      select: { payload: true },
    }),
    prisma.passbook.findMany({
      where: { type: "VENDOR" },
      select: { payload: true },
    }),
  ]);

  const totalOffset = members
    .map((m) => m.passbook.joiningOffset + m.passbook.delayOffset)
    .reduce((a, b) => a + b, 0);

  const memberTotalDeposit = getMemberTotalDepositUpToday();
  const activeMemberCount = members.filter((m) => m.active).length;
  const clubData = clubPassbook.payload as ClubPassbookData;

  const totalVendorProfit = vendorPassbooks
    .map((v) => {
      const { totalInvestment = 0, totalReturns = 0 } =
        v.payload as VendorPassbookData;
      return Math.max(totalReturns - totalInvestment, 0);
    })
    .reduce((a, b) => a + b, 0);

  const totalProfitCollected =
    totalOffset + clubData.totalInterestPaid + totalVendorProfit;
  const availableProfit =
    totalProfitCollected - clubData.totalMemberProfitWithdrawals;
  const totalReturnPerMember =
    activeMemberCount > 0 ? availableProfit / activeMemberCount : 0;

  // Calculate total interest amount from all members' loan histories (on-the-fly)
  const memberLoanHistories = await Promise.all(
    members.map((member) => getMemberLoanHistory(member.id))
  )

  const totalInterestAmount = memberLoanHistories.reduce(
    (sum, { totalInterestAmount }) => sum + totalInterestAmount,
    0
  )

  const totalInterestBalance = totalInterestAmount - clubData.totalInterestPaid;
  const expectedLoanProfitPerMember =
    activeMemberCount > 0 ? totalInterestBalance / activeMemberCount : 0;

  return {
    members,
    clubData,
    vendorPassbooks,
    totalOffset,
    memberTotalDeposit,
    activeMemberCount,
    totalVendorProfit,
    totalProfitCollected,
    availableProfit,
    totalReturnPerMember,
    totalInterestAmount,
    totalInterestBalance,
    expectedLoanProfitPerMember,
  };
}
