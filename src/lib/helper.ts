import { calculateTimePassed, getMonthsPassedString } from "./date";

import prisma from "@/db";

export const chitCalculator = (
  start: string | Date,
  end?: string | Date | null
) => {
  // Input values
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  const { nextStartDate, monthsPassed, daysPassed } = calculateTimePassed(
    startDate,
    endDate
  );

  return {
    monthsPassed,
    daysPassed,
    nextDueDate: nextStartDate.getTime(),
    monthsPassedString: getMonthsPassedString(monthsPassed, daysPassed),
  };
};

type PassbookToUpdate = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;

export const bulkPassbookUpdate = async (items: PassbookToUpdate) => {
  try {
    await prisma.$transaction(
      Array.from(items, ([_, value]) => value).map(prisma.passbook.update)
    );
    console.log("Bulk passbook updated successfully");
  } catch (e) {
    console.error("Bulk passbook updated failed");
    console.error(e);
  }
};
