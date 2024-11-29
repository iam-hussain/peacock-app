import { transformLoanForTable } from "@/app/api/account/loan/route";
import { membersTableTransform } from "@/app/api/account/member/route";
import prisma from "@/db";
import { getMemberTotalDepositUpToday } from "@/lib/club";
import { memberMonthsPassedString } from "@/lib/date";
import { ClubPassbookData, VendorPassbookData } from "@/lib/type";

export const getMemberBySlug = async (slug: string) => {
  const [account, club, membersCount, offsetData, vendorsPass] =
    await Promise.all([
      prisma.account.findUniqueOrThrow({
        where: { slug, isMember: true },
        include: {
          passbook: true,
        },
      }),
      prisma.passbook.findFirstOrThrow({
        where: {
          type: "CLUB",
        },
        select: {
          payload: true,
        },
      }),
      prisma.account.count({
        where: {
          isMember: true,
        },
      }),
      prisma.passbook.aggregate({
        where: {
          type: "MEMBER",
        },
        _sum: {
          delayOffset: true,
          joiningOffset: true,
        },
      }),
      prisma.passbook.findMany({
        where: {
          type: "VENDOR",
        },
        select: {
          payload: true,
        },
      }),
    ]);

  const totalVendorProfit = vendorsPass
    .map((e) => {
      const { totalInvestment = 0, totalReturns = 0 } =
        e.payload as VendorPassbookData;
      return Math.max(totalReturns - totalInvestment, 0);
    })
    .reduce((a, b) => a + b, 0);

  const totalOffsetAmount =
    (offsetData._sum.delayOffset || 0) + (offsetData._sum.joiningOffset || 0);
  const clubData = club.payload as ClubPassbookData;
  const totalProfitCollected =
    totalOffsetAmount + clubData.totalInterestPaid + totalVendorProfit;

  const availableProfitAmount =
    totalProfitCollected - clubData.totalMemberProfitWithdrawals;

  const totalReturnAmount = availableProfitAmount / membersCount;

  const memberTotalDeposit = getMemberTotalDepositUpToday();
  const memberLoan = transformLoanForTable(account);
  const memberData = membersTableTransform(
    account,
    memberTotalDeposit,
    totalReturnAmount
  );

  return {
    ...memberLoan,
    ...memberData,
    ...memberMonthsPassedString(account.startAt),
  };
};
