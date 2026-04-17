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
 * Call after every transaction write (via `transactionEntryHandler`),
 * after member/vendor active toggles, after offset edits, and at the
 * end of a full reset.
 *
 * Options:
 *   - `skipLoanInterest`: reuse the currently-stored expectedTotalLoanInterest
 *     instead of recomputing. The expected-interest recompute fetches every
 *     loan transaction since club start, so skip it on hot paths where the
 *     transaction cannot possibly affect loans (PERIODIC_DEPOSIT,
 *     OFFSET_DEPOSIT, WITHDRAW, FUNDS_TRANSFER, VENDOR_*). Only LOAN_TAKEN,
 *     LOAN_REPAY, LOAN_INTEREST and reset flows should recompute it.
 */
export async function recomputeClubDashboardAggregates(
  db: DbClient = prisma,
  options: { skipLoanInterest?: boolean } = {}
): Promise<Partial<ClubFinancialSnapshot> | null> {
  const { skipLoanInterest = false } = options;

  const [clubPassbook, activeMemberPassbooks, freshInterest] =
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
      skipLoanInterest
        ? Promise.resolve(null)
        : calculateExpectedTotalLoanInterestAmountFromDb(),
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
      };
      const periodicDeposits =
        payload.periodicDepositsTotal ?? payload.periodicDepositAmount ?? 0;
      const offsetDeposits =
        payload.offsetDepositsTotal ?? payload.offsetDepositAmount ?? 0;
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
        periodicOnly: acc.periodicOnly + periodicDeposits,
        expectedAdjustments: acc.expectedAdjustments + totalOffset,
      };
    },
    { pending: 0, periodicOnly: 0, expectedAdjustments: 0 }
  );

  // Reuse stored value when skipping the loan-history recompute (hot path).
  const expectedTotalLoanInterest =
    freshInterest?.expectedTotalLoanInterestAmount ??
    clubData.expectedTotalLoanInterest ??
    0;
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
