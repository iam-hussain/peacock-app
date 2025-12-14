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

export const getClubTotalDepositUpToday = (membersCount: number): number => {
  const perMember = getMemberTotalDepositUpToday();

  return perMember * membersCount;
};

export const clubMonthsFromStart = () => {
  return calculateMonthsDifference(newZoneDate(), clubConfig.startedAt) + 1;
};

export const getMemberTotalDepositUpToday = () => {
  const values = clubConfig.stages.map((e) => {
    const diff = calculateMonthsDifference(
      newZoneDate(e?.endDate || undefined),
      newZoneDate(e.startDate)
    );
    return diff * e.amount;
  });

  return values.reduce((a, b) => {
    return a + Math.abs(b);
  }, 0);
};
