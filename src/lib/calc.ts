import {
  addMonths,
  differenceInDays,
  differenceInMonths,
  isAfter,
  isBefore,
} from "date-fns";

import { clubConfig } from "./config";

const getPeriodString = (months: number, days: number) => {
  return months ? `${months} mons${days ? ` ${days} d` : ""}` : null;
};

const calculateTimePassed = (startDate: Date, endDate: Date) => {
  // Calculate total months
  const monthsPassed = differenceInMonths(endDate, startDate);

  // Calculate remaining days
  const dateAfterFullMonths = addMonths(startDate, monthsPassed);
  const daysPassed = differenceInDays(endDate, dateAfterFullMonths);

  return {
    monthsPassed,
    daysPassed,
  };
};

const getNextDueDate = (start: string | Date, end?: string | Date | null) => {
  const startDate = new Date(start);

  // Calculate next due date if no end date is provided or the current date is before the end date
  let nextDueDate: Date | null = null;
  const currentDate = new Date();

  if (!end || isBefore(currentDate, new Date(end))) {
    const monthsPassed = differenceInMonths(new Date(), startDate);
    nextDueDate = addMonths(startDate, monthsPassed + 1);

    // If the current date is after the now date, calculate the next due date
    if (isAfter(new Date(), nextDueDate)) {
      nextDueDate = new Date(addMonths(nextDueDate, 1));
    }

    // If remaining time is less than a month, set endDate as the next due date
    if (end && differenceInMonths(new Date(end), currentDate) === 0) {
      nextDueDate = new Date(end);
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
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const nextDueDate = getNextDueDate(start, end);
  const actualPassed = calculateTimePassed(startDate, endDate);

  const { monthsPassed, daysPassed } = calculateTimePassed(
    startDate,
    nextDueDate || new Date()
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
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

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
    new Date(start).getTime() < new Date(clubConfig.dayInterestFrom).getTime()
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
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  const { monthsPassed, daysPassed } = calculateTimePassed(startDate, endDate);

  return {
    monthsPassed,
    daysPassed,
    nextDueDate: getNextDueDate(start, end),
    period: getPeriodString(monthsPassed, daysPassed),
  };
};
