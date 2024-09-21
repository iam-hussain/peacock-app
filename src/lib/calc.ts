import {
  addMonths,
  differenceInDays,
  differenceInMonths,
  isAfter,
  isBefore,
} from "date-fns";

const getPeriodString = (months: number, days: number) => {
  return months ? `${months} mons${days ? ` ${days} d` : ""}` : null;
};

const getTimePassed = (startDate: Date, endDate: Date) => {
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

export const loanCalculator = (
  amount: number,
  start: string | Date,
  end?: string | Date | null,
  interestRate: number = 0.01
) => {
  // Input values
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  const { monthsPassed, daysPassed } = getTimePassed(startDate, endDate);

  // Calculate interest for full months
  const interestForMonths = monthsPassed * amount * interestRate;

  // Calculate interest for remaining days (assuming 30 days in a month)
  const interestForDays = (daysPassed / 30) * amount * interestRate;

  // Total interest
  const totalAmount = interestForMonths + interestForDays;

  return {
    monthsPassed,
    daysPassed,
    totalAmount,
    nextDueDate: getNextDueDate(start, end),
    period: getPeriodString(monthsPassed, daysPassed),
  };
};

export const loanCalculatorLegacy = (
  amount: number,
  start: string | Date,
  end?: string | Date | null,
  interestRate: number = 0.01
) => {
  // Input values
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  const { monthsPassed, daysPassed } = getTimePassed(startDate, endDate);

  // Calculate interest for full months
  const totalAmount = monthsPassed * amount * interestRate;

  return {
    monthsPassed,
    daysPassed,
    totalAmount,
    nextDueDate: getNextDueDate(start, end),
    period: getPeriodString(monthsPassed, daysPassed),
  };
};

export const chitCalculator = (
  start: string | Date,
  end?: string | Date | null
) => {
  // Input values
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  const { monthsPassed, daysPassed } = getTimePassed(startDate, endDate);

  return {
    monthsPassed,
    daysPassed,
    nextDueDate: getNextDueDate(start, end),
    period: getPeriodString(monthsPassed, daysPassed),
  };
};
