import { Transaction } from "@prisma/client";
import { endOfMonth } from "date-fns";

import prisma from "@/db";
import { calculateLoanDetails } from "@/lib/calculators/loan-calculator";
import { clubConfig } from "@/lib/config/config";
import { newZoneDate } from "@/lib/core/date";
import { calculateInterestByAmount } from "@/lib/helper";
import { PassbookToUpdate } from "@/lib/validators/type";

/**
 * Loan history entry structure from passbook
 */
type LoanHistoryEntry = {
  amount: number;
  startDate: Date | string | number;
  endDate?: Date | string | number;
  active?: boolean;
};

/**
 * Calculates expected total loan interest amount from member passbooks
 * This sums up the interest for all active and completed loans across all members
 */
export function calculateExpectedTotalLoanInterestAmount(
  allPassbooks: PassbookToUpdate
): number {
  try {
    // Get all member passbooks
    const memberEntry = allPassbooks.get("MEMBER");
    if (!memberEntry) {
      return 0;
    }

    // Handle both array and single entry formats
    const membersPassbooks = Array.isArray(memberEntry)
      ? memberEntry
      : [memberEntry];

    // Extract loanHistory from each member passbook and calculate interest
    const expectedTotalLoanInterestAmount = membersPassbooks
      .map((entry: any) => {
        // Get loanHistory from the passbook data
        const loanHistory = entry.data?.loanHistory || [];

        // Ensure loanHistory is an array
        const loanHistoryArray = Array.isArray(loanHistory)
          ? loanHistory
          : typeof loanHistory === "string"
            ? JSON.parse(loanHistory)
            : [];

        return loanHistoryArray;
      })
      .flat()
      .map((loan: LoanHistoryEntry) => {
        // Calculate interest for each loan
        const { interestAmount } = calculateInterestByAmount(
          loan.amount || 0,
          loan.startDate || new Date(),
          loan?.endDate
        );
        return interestAmount;
      })
      .reduce((a, b) => a + b, 0);

    return expectedTotalLoanInterestAmount;
  } catch (error) {
    console.error(
      "Error calculating expected total loan interest amount:",
      error
    );
    return 0;
  }
}

/**
 * Calculates expected total loan interest amount from provided transactions
 * Filters transactions by date range and calculates interest for each member's loans
 */
export function calculateExpectedTotalLoanInterestAmountFromTransactions(
  allTransactions: Transaction[],
  endDate?: Date
): { expectedTotalLoanInterestAmount: number } {
  try {
    // Get club start date and end date (current month end if not provided)
    const clubStartDate = newZoneDate(clubConfig.startedAt);
    const monthEnd = endDate ? new Date(endDate) : new Date();

    // Filter loan transactions from club start to end date
    const allLoanTransactions = allTransactions.filter(
      (tx) =>
        (tx.type === "LOAN_TAKEN" || tx.type === "LOAN_REPAY") &&
        tx.occurredAt >= clubStartDate &&
        tx.occurredAt <= monthEnd
    );

    // Group transactions by member (toId for LOAN_TAKEN, fromId for LOAN_REPAY)
    const memberTransactionsMap = new Map<string, typeof allLoanTransactions>();

    allLoanTransactions.forEach((transaction) => {
      let memberId: string | null = null;

      if (transaction.type === "LOAN_TAKEN") {
        memberId = transaction.toId;
      } else if (transaction.type === "LOAN_REPAY") {
        memberId = transaction.fromId;
      }

      if (memberId) {
        if (!memberTransactionsMap.has(memberId)) {
          memberTransactionsMap.set(memberId, []);
        }
        memberTransactionsMap.get(memberId)!.push(transaction);
      }
    });
    // Calculate interest for each member's loans
    const memberLoanHistories = Array.from(memberTransactionsMap.entries()).map(
      ([_memberId, transactions]) => {
        // Calculate loan details from transactions
        const { loanHistory } = calculateLoanDetails(transactions);

        // Calculate interest for each loan entry from club start to current month end
        return loanHistory.map((loan) => {
          // Use the loan start date (or club start date if loan started before club)
          const loanStartDate = loan.startDate
            ? newZoneDate(loan.startDate)
            : clubStartDate;
          const actualStartDate =
            loanStartDate < clubStartDate ? clubStartDate : loanStartDate;

          // Use loan end date if available, otherwise use month end
          let loanEndDate: Date;
          if (loan.endDate) {
            const endDateObj = newZoneDate(loan.endDate);
            loanEndDate = monthEnd < endDateObj ? monthEnd : endDateObj;
          } else {
            loanEndDate = monthEnd;
          }

          // Calculate interest from actual start to end date
          const { interestAmount } = calculateInterestByAmount(
            loan.amount ?? 0,
            actualStartDate,
            loanEndDate
          );
          return interestAmount;
        });
      }
    );

    // Sum up all interest amounts from all members
    const expectedTotalLoanInterestAmount = memberLoanHistories
      .flat()
      .reduce((a, b) => a + b, 0);

    return { expectedTotalLoanInterestAmount };
  } catch (error) {
    console.error(
      "Error calculating expected total loan interest amount from transactions:",
      error
    );
    return { expectedTotalLoanInterestAmount: 0 };
  }
}

/**
 * Calculates expected total loan interest amount by fetching all loans dynamically from transactions
 * This replaces reading from passbook.loanHistory and calculates on-the-fly from transactions
 * Calculates interest from club start date to the specified end date (or current month end if not provided)
 */
export async function calculateExpectedTotalLoanInterestAmountFromDb(
  endDate?: Date
): Promise<{ expectedTotalLoanInterestAmount: number }> {
  try {
    // Get club start date and end date (current month end if not provided)
    const clubStartDate = newZoneDate(clubConfig.startedAt);
    const monthEnd = endDate ? endOfMonth(endDate) : endOfMonth(newZoneDate());

    // Fetch all loan transactions from club start to current month
    const allLoanTransactions = await prisma.transaction.findMany({
      where: {
        type: { in: ["LOAN_TAKEN", "LOAN_REPAY", "LOAN_INTEREST"] },
        occurredAt: {
          gte: clubStartDate,
          lte: monthEnd,
        },
      },
      orderBy: { occurredAt: "asc" },
    });

    // Use the shared calculation logic
    return calculateExpectedTotalLoanInterestAmountFromTransactions(
      allLoanTransactions,
      endDate
    );
  } catch (error) {
    console.error(
      "Error calculating expected total loan interest amount from DB:",
      error
    );
    return { expectedTotalLoanInterestAmount: 0 };
  }
}
