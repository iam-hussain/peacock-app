import prisma from "@/db";
import { getMemberLoanHistory } from "@/lib/calculators/loan-calculator";
import { getMemberTotalDepositUpToday } from "@/lib/config/club";
import {
  ClubFinancialSnapshot,
  VendorFinancialSnapshot,
} from "@/lib/validators/type";

export async function getMemberClubStats() {
  const [members, clubPassbook, vendorPassbooks] = await Promise.all([
    prisma.account.findMany({
      where: { type: "MEMBER" },
      include: { passbook: true },
    }),
    prisma.passbook
      .findFirst({
        where: { kind: "CLUB" },
        select: { payload: true },
      })
      .then((club) => {
        if (!club) {
          throw new Error(
            "CLUB passbook not found. Please run seed to initialize database."
          );
        }
        return club;
      }),
    prisma.passbook.findMany({
      where: { kind: "VENDOR" },
      select: { payload: true },
    }),
  ]);

  const totalOffset = members
    .filter((m) => m.passbook !== null)
    .map(
      (m) => (m.passbook?.joiningOffset || 0) + (m.passbook?.delayOffset || 0)
    )
    .reduce((a, b) => a + b, 0);

  const memberTotalDeposit = getMemberTotalDepositUpToday();
  const activeMemberCount = members.filter((m) => m.status === "ACTIVE").length;
  const clubData = clubPassbook.payload as ClubFinancialSnapshot;

  const totalVendorProfit = vendorPassbooks
    .map((v) => {
      const { investmentTotal = 0, returnsTotal = 0 } =
        v.payload as VendorFinancialSnapshot;
      return Math.max(returnsTotal - investmentTotal, 0);
    })
    .reduce((a, b) => a + b, 0);

  const totalProfitCollected =
    totalOffset + clubData.interestCollectedTotal + totalVendorProfit;
  const availableProfit =
    totalProfitCollected - clubData.memberProfitWithdrawalsTotal;
  const totalReturnPerMember =
    activeMemberCount > 0 ? availableProfit / activeMemberCount : 0;

  // Calculate total interest amount from all members' loan histories (on-the-fly)
  const memberLoanHistories = await Promise.all(
    members.map((member) => getMemberLoanHistory(member.id))
  );

  const totalInterestAmount = memberLoanHistories.reduce(
    (sum, { totalInterestAmount }) => sum + totalInterestAmount,
    0
  );

  const totalInterestBalance =
    totalInterestAmount - clubData.interestCollectedTotal;
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
