import { clubConfig } from "./config";
import { monthsDiff, newDate } from "./date";

export const memberTotalDepositAmount = () => {
  const values = clubConfig.stages.map((e) => {
    const diff = monthsDiff(
      e?.endDate ? new Date(e.endDate) : new Date(),
      new Date(e.startDate)
    );
    return diff * e.amount;
  });

  return values.reduce((a, b) => {
    return a + Math.abs(b);
  }, 0);
};

// Function to calculate how many months you've paid based on the total paid and paying this month
export const calculateMonthsPaid = (totalPaid: number): number => {
  let remainingPaid = totalPaid;
  let totalMonths = 0;

  for (const stage of clubConfig.stages) {
    const { amount, startDate, endDate } = stage;

    // Calculate the number of months in the current stage
    const stageEndDate = endDate || new Date(); // Use current date if endDate is not provided
    const monthsInStage = monthsDiff(stageEndDate, startDate) + 1; // +1 to include the starting month

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

export const calculateTotalDeposit = (membersCount: number): number => {
  const perMember = memberTotalDepositAmount();

  return perMember * membersCount;
};

export const clubMonthsFromStart = () => {
  console.log({ diff: monthsDiff(clubConfig.startedAt, new Date()) });
  return monthsDiff(new Date(), clubConfig.startedAt) + 1;
};
