import { clubConfig } from "./config";

import { calculateMonthsDifference, newZoneDate } from "@/lib/core/date";

export function calculateMonthlyInterest(
  principal: number,
  annualRate: number = 12
): number {
  // Convert the annual interest rate to a monthly interest rate
  const monthlyInterest = (principal * annualRate) / (12 * 100);
  return monthlyInterest;
}

// Function to calculate how many months you've paid based on the total paid and paying this month
export const calculateMonthsPaid = (totalPaid: number): number => {
  let remainingPaid = totalPaid;
  let totalMonths = 0;

  for (const stage of clubConfig.stages) {
    const { amount, startDate, endDate } = stage;

    // Calculate the number of months in the current stage
    const stageEndDate = endDate || newZoneDate(); // Use current date if endDate is not provided
    const monthsInStage =
      calculateMonthsDifference(stageEndDate, startDate) + 1; // +1 to include the starting month

    // Calculate the total amount for this stage
    const stageTotalAmount = monthsInStage * amount;

    if (remainingPaid >= stageTotalAmount) {
      // If the remaining paid covers the entire stage, add all the months
      totalMonths += monthsInStage;
      remainingPaid -= stageTotalAmount;
    } else {
      // If the remaining paid doesn't cover the entire stage, calculate how many months it covers
      const monthsCoveredInStage = Math.floor(remainingPaid / amount);
      totalMonths += monthsCoveredInStage;
      remainingPaid -= monthsCoveredInStage * amount;
      break; // Exit once the remaining paid is exhausted
    }
  }

  return totalMonths;
};

export const clubMonthsFromStart = (_current: Date = new Date()) => {
  const current = newZoneDate(_current);
  return calculateMonthsDifference(current, clubConfig.startedAt) + 1;
};

const minDate = (a: Date, b: Date) => (a.getTime() <= b.getTime() ? a : b);

/**
 * Total deposit expected from ONE member up to `endDate`
 */
export const getMemberTotalDeposit = (endDate: Date = new Date()): number => {
  const end = newZoneDate(endDate);

  return clubConfig.stages.reduce((total, stage) => {
    const stageStart = newZoneDate(stage.startDate);

    // If stage hasn't started yet → no contribution
    if (end.getTime() <= stageStart.getTime()) {
      return total;
    }

    // Cap stage end to the earlier of (stage.endDate, endDate)
    const stageEnd = stage.endDate
      ? minDate(newZoneDate(stage.endDate), end)
      : end;

    if (stageEnd.getTime() <= stageStart.getTime()) {
      return total;
    }

    const months = calculateMonthsDifference(stageEnd, stageStart);
    return total + months * stage.amount;
  }, 0);
};

/**
 * Total deposit expected from the whole club
 */
export const getClubTotalDeposit = (
  membersCount: number,
  endDate: Date = new Date()
): number => {
  const perMember = getMemberTotalDeposit(endDate);
  return perMember * Math.max(0, membersCount);
};
