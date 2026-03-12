/**
 * Loan and chit calculators
 *
 * The canonical interest calculation is `calculateInterestByAmount` in `@/lib/helper`.
 * These calculators add vendor/loan-specific behavior on top of it.
 */

import {
  addMonths,
  differenceInDays,
  differenceInMonths,
  isAfter,
  isBefore,
} from "date-fns";

import { clubConfig } from "@/lib/config/config";
import { DEFAULT_INTEREST_RATE } from "@/lib/config/constants";
import { calculateTimePassed, newZoneDate } from "@/lib/core/date";

const getPeriodString = (months: number, days: number) => {
  return months ? `${months} mons${days ? ` ${days} d` : ""}` : null;
};

const getNextDueDate = (start: string | Date, end?: string | Date | null) => {
  const startDate = newZoneDate(start);

  let nextDueDate: Date | null = null;
  const currentDate = newZoneDate();

  if (!end || isBefore(currentDate, newZoneDate(end))) {
    const monthsPassed = differenceInMonths(newZoneDate(), startDate);
    nextDueDate = addMonths(startDate, monthsPassed + 1);

    if (isAfter(newZoneDate(), nextDueDate)) {
      nextDueDate = newZoneDate(addMonths(nextDueDate, 1));
    }

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
  interestRate: number = DEFAULT_INTEREST_RATE
) => {
  const startDate = newZoneDate(start);
  const endDate = newZoneDate(end || undefined);
  const nextDueDate = getNextDueDate(start, end);
  const actualPassed = calculateTimePassed(startDate, endDate);

  const { monthsPassed, daysPassed } = calculateTimePassed(
    startDate,
    nextDueDate || newZoneDate()
  );

  const interestForMonths = monthsPassed * amount * interestRate;
  const interestForDays = (daysPassed / 30) * amount * interestRate;
  let totalAmount = interestForMonths + interestForDays;

  if (end && nextDueDate && differenceInDays(nextDueDate, endDate) >= 20) {
    const monthsInterest = actualPassed.monthsPassed * amount * interestRate;
    const daysInterest = (actualPassed.daysPassed / 30) * amount * interestRate;
    totalAmount = monthsInterest + daysInterest;
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
  interestRate: number = DEFAULT_INTEREST_RATE
) => {
  const startDate = newZoneDate(start);
  const endDate = newZoneDate(end || undefined);

  const { monthsPassed, daysPassed } = calculateTimePassed(startDate, endDate);

  const monthsCount = daysPassed > 15 ? monthsPassed + 1 : monthsPassed;
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
  interestRate: number = DEFAULT_INTEREST_RATE
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
