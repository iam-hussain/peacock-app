import { PrismaClient } from "@prisma/client";

import prisma from "@/db";
import { calculateExpectedTotalLoanInterestAmountFromDb } from "@/lib/calculators/expected-interest";
import { getMemberTotalDeposit } from "@/lib/config/club";
import {
  ClubFinancialSnapshot,
  MemberFinancialSnapshot,
} from "@/lib/validators/type";

type DbClient = PrismaClient | typeof prisma;

/**
 * Recomputes the derived aggregates on the CLUB passbook.
 *
 * These fields depend on member.active status and stage-based expected
 * deposits, so they sit outside the per-transaction accumulator model
 * defined in `src/logic/settings.ts`. This helper re-derives them from
 * current DB state and writes them onto the CLUB passbook payload.
 *
 * Call after every transaction write (via `transactionEntryHandler`) and
 * at the end of a full reset.
 */
export async function recomputeClubDashboardAggregates(
  db: DbClient = prisma
): Promise<Partial<ClubFinancialSnapshot> | null> {
  const [clubPassbook, activeMemberPassbooks, expectedInterest] =
    await Promise.all([
      db.passbook.findFirst({
        where: { kind: "CLUB" },
        select: { id: true, payload: true },
      }),
      db.passbook.findMany({
        where: {
          kind: "MEMBER",
          account: { type: "MEMBER", status: "ACTIVE" },
        },
        select: {
          joiningOffset: true,
          delayOffset: true,
          payload: true,
        },
      }),
      calculateExpectedTotalLoanInterestAmountFromDb(),
    ]);

  if (!clubPassbook) {
    return null;
  }

  const clubData = (clubPassbook.payload || {}) as ClubFinancialSnapshot;
  const activeMembersCount = activeMemberPassbooks.length;
  const memberTotalDepositExpected = getMemberTotalDeposit();

  const totals = activeMemberPassbooks.reduce(
    (acc, pb) => {
      const payload = (pb.payload || {}) as MemberFinancialSnapshot & {
        periodicDepositAmount?: number;
        offsetDepositAmount?: number;
        profitWithdrawalAmount?: number;
      };
      const periodicDeposits =
        payload.periodicDepositsTotal ?? payload.periodicDepositAmount ?? 0;
      const offsetDeposits =
        payload.offsetDepositsTotal ?? payload.offsetDepositAmount ?? 0;
      const profitWithdrawals =
        payload.profitWithdrawalsTotal ?? payload.profitWithdrawalAmount ?? 0;
      const joining = Number(pb.joiningOffset) || 0;
      const delay = Number(pb.delayOffset) || 0;
      const totalOffset = joining + delay;

      // Pending = expected contributions − actual contributions received.
      // Uses (periodic + offset) deposits, NOT accountBalance — so prior
      // withdrawals don't make the member appear to "owe" their principal
      // back (Bug 4). An exiting member with deposits = withdrawals will
      // correctly show 0 remaining expected contribution (no residual debt
      // from their withdrawal).
      const actualContributions = periodicDeposits + offsetDeposits;
      return {
        pending:
          acc.pending +
          memberTotalDepositExpected +
          totalOffset -
          actualContributions,
        deposited:
          acc.deposited + periodicDeposits + offsetDeposits - profitWithdrawals,
        periodicOnly: acc.periodicOnly + periodicDeposits,
        expectedAdjustments: acc.expectedAdjustments + totalOffset,
      };
    },
    { pending: 0, deposited: 0, periodicOnly: 0, expectedAdjustments: 0 }
  );

  const expectedTotalLoanInterest =
    expectedInterest.expectedTotalLoanInterestAmount;
  const pendingLoanInterest = Math.max(
    0,
    expectedTotalLoanInterest - (clubData.interestCollectedTotal || 0)
  );
  const pendingAdjustmentsTotal = Math.max(
    0,
    totals.expectedAdjustments - (clubData.memberOffsetDepositsTotal || 0)
  );

  const aggregates: Partial<ClubFinancialSnapshot> = {
    activeMembersCount,
    memberTotalDepositExpected,
    activeMemberDepositedTotal: totals.deposited,
    activeMemberPeriodicDepositsTotal: totals.periodicOnly,
    activeMemberPendingTotal: totals.pending,
    activeMemberExpectedAdjustments: totals.expectedAdjustments,
    pendingAdjustmentsTotal,
    expectedTotalLoanInterest,
    pendingLoanInterest,
    aggregatesComputedAt: new Date().toISOString(),
  };

  await db.passbook.update({
    where: { id: clubPassbook.id },
    data: {
      payload: {
        ...clubData,
        ...aggregates,
      },
    },
  });

  return aggregates;
}
