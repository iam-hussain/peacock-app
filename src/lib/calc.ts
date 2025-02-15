import {
  addMonths,
  differenceInDays,
  differenceInMonths,
  isAfter,
  isBefore,
} from "date-fns";

import { clubConfig } from "./config";
import { calculateTimePassed, newZoneDate } from "./date";

const getPeriodString = (months: number, days: number) => {
  return months ? `${months} mons${days ? ` ${days} d` : ""}` : null;
};

const getNextDueDate = (start: string | Date, end?: string | Date | null) => {
  const startDate = newZoneDate(start);

  // Calculate next due date if no end date is provided or the current date is before the end date
  let nextDueDate: Date | null = null;
  const currentDate = newZoneDate();

  if (!end || isBefore(currentDate, newZoneDate(end))) {
    const monthsPassed = differenceInMonths(newZoneDate(), startDate);
    nextDueDate = addMonths(startDate, monthsPassed + 1);

    // If the current date is after the now date, calculate the next due date
    if (isAfter(newZoneDate(), nextDueDate)) {
      nextDueDate = newZoneDate(addMonths(nextDueDate, 1));
    }

    // If remaining time is less than a month, set endDate as the next due date
    if (end && differenceInMonths(newZoneDate(end), currentDate) === 0) {
      nextDueDate = newZoneDate(end);
    }
  }

  return nextDueDate;
};

export const newLoanCalculator = (
  amount: number,
  start: string | Date,
  end?: string | Date | null,
  interestRate: number = 0.01
) => {
  // Input values
  const startDate = newZoneDate(start);
  const endDate = newZoneDate(end || undefined);
  const nextDueDate = getNextDueDate(start, end);
  const actualPassed = calculateTimePassed(startDate, endDate);

  const { monthsPassed, daysPassed } = calculateTimePassed(
    startDate,
    nextDueDate || newZoneDate()
  );

  // Calculate interest for full months
  const interestForMonths = monthsPassed * amount * interestRate;

  // Calculate interest for remaining days (assuming 30 days in a month)
  const interestForDays = (daysPassed / 30) * amount * interestRate;

  // Total interest
  let totalAmount = interestForMonths + interestForDays;

  // If end is near 20 days calculate fully
  if (end && nextDueDate && differenceInDays(nextDueDate, endDate) >= 20) {
    // Calculate interest for full months
    const interestForMonths = actualPassed.monthsPassed * amount * interestRate;

    // Calculate interest for remaining days (assuming 30 days in a month)
    const interestForDays =
      (actualPassed.daysPassed / 30) * amount * interestRate;

    // Total interest
    totalAmount = interestForMonths + interestForDays;
  }

  return {
    monthsPassed,
    daysPassed,
    totalAmount,
    nextDueDate: getNextDueDate(start, end),
    period: getPeriodString(actualPassed.monthsPassed, actualPassed.daysPassed),
  };
};

export const legacyLoanCalculator = (
  amount: number,
  start: string | Date,
  end?: string | Date | null,
  interestRate: number = 0.01
) => {
  // Input values
  const startDate = newZoneDate(start);
  const endDate = newZoneDate(end || undefined);

  const { monthsPassed, daysPassed } = calculateTimePassed(startDate, endDate);

  const monthsCount = daysPassed > 15 ? monthsPassed + 1 : monthsPassed;
  // Calculate interest for full months
  const totalAmount = monthsCount * amount * interestRate;

  return {
    monthsPassed,
    daysPassed,
    totalAmount,
    nextDueDate: getNextDueDate(start, end),
    period: getPeriodString(monthsPassed, daysPassed),
  };
};

export const loanCalculator = (
  amount: number,
  start: string | Date,
  end?: string | Date | null,
  interestRate: number = 0.01
) => {
  if (
    newZoneDate(start).getTime() <
    newZoneDate(clubConfig.dayInterestFrom).getTime()
  ) {
    return legacyLoanCalculator(amount, start, end, interestRate);
  }
  return newLoanCalculator(amount, start, end, interestRate);
};

export const chitCalculator = (
  start: string | Date,
  end?: string | Date | null
) => {
  // Input values
  const startDate = newZoneDate(start);
  const endDate = newZoneDate(end || undefined);

  const { monthsPassed, daysPassed } = calculateTimePassed(startDate, endDate);

  return {
    monthsPassed,
    daysPassed,
    nextDueDate: getNextDueDate(start, end),
    period: getPeriodString(monthsPassed, daysPassed),
  };
};
