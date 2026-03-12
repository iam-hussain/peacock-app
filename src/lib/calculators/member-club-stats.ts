import prisma from "@/db";
import {
  calculateLoanDetails,
} from "@/lib/calculators/loan-calculator";
import { clubConfig } from "@/lib/config/config";
import { getMemberTotalDeposit } from "@/lib/config/club";
import { newZoneDate } from "@/lib/core/date";
import { calculateInterestByAmount } from "@/lib/helper";
import {
  ClubFinancialSnapshot,
  VendorFinancialSnapshot,
} from "@/lib/validators/type";

export async function getMemberClubStats() {
  // Fetch members, club passbook, vendor passbooks, AND all loan transactions in parallel (1 query each)
  const [members, clubPassbook, vendorPassbooks, allLoanTransactions] =
    await Promise.all([
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
      // Single query for ALL loan transactions instead of N+1
      prisma.transaction.findMany({
        where: {
          type: { in: ["LOAN_TAKEN", "LOAN_REPAY"] },
        },
        orderBy: { occurredAt: "asc" },
      }),
    ]);

  const totalOffset = members
    .filter((m) => m.passbook !== null)
    .map(
      (m) => (m.passbook?.joiningOffset || 0) + (m.passbook?.delayOffset || 0)
    )
    .reduce((a, b) => a + b, 0);

  const memberTotalDeposit = getMemberTotalDeposit();
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

  // Group loan transactions by member ID in memory (instead of N+1 queries)
  const txByMember = new Map<string, typeof allLoanTransactions>();
  for (const tx of allLoanTransactions) {
    const memberId =
      tx.type === "LOAN_TAKEN" ? tx.toId : tx.fromId;
    if (!txByMember.has(memberId)) {
      txByMember.set(memberId, []);
    }
    txByMember.get(memberId)!.push(tx);
  }

  // Calculate total interest from loan histories for each member
  const clubStartDate = newZoneDate(clubConfig.startedAt);
  let totalInterestAmount = 0;

  for (const member of members) {
    const memberTxs = txByMember.get(member.id) || [];
    if (memberTxs.length === 0) continue;

    const { loanHistory } = calculateLoanDetails(memberTxs);

    for (let i = 0; i < loanHistory.length; i++) {
      const loan = loanHistory[i]!;
      const loanStartDate = loan.startDate
        ? newZoneDate(loan.startDate)
        : newZoneDate();
      const actualStartDate =
        loanStartDate < clubStartDate ? clubStartDate : loanStartDate;

      const loanEndDate: Date = loan.endDate
        ? newZoneDate(loan.endDate)
        : newZoneDate();

      const { rawInterestAmount } = calculateInterestByAmount(
        loan.amount ?? 0,
        actualStartDate,
        loanEndDate
      );
      totalInterestAmount += rawInterestAmount;
    }
  }

  totalInterestAmount = Math.round(totalInterestAmount);

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
