import {
  addMonths,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  format,
  formatDistance,
  formatRelative,
  parse,
} from "date-fns";
import { differenceInCalendarMonths } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const timeZone = "Asia/Kolkata";

/**
 * Creates a new date in the specified time zone, with or without time.
 * @param {Date|string} date - The input date (can be a Date object or a date string).
 * @param {boolean} [includeTime=true] - If true, includes the time; otherwise, sets time to 00:00:00.
 * @returns {Date} - A new Date object in the specified time zone.
 */
export function newZoneDate(
  date?: Date | string | number,
  excludeTime?: boolean
): Date {
  // Convert the input date to a Date object if it's not already
  const inputDate =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date || new Date();

  // Check if the input date is already in the desired timezone
  const isAlreadyIST =
    Intl.DateTimeFormat().resolvedOptions().timeZone === timeZone;

  // Convert the date to the specified time zone if it's not already in IST
  const zonedDate = isAlreadyIST ? inputDate : toZonedTime(inputDate, timeZone);

  // Extract the year, month, and day from the zoned date
  const year = zonedDate.getFullYear();
  const month = zonedDate.getMonth();
  const day = zonedDate.getDate();

  // If includeTime is true, include the time components; otherwise, set time to 00:00:00
  if (excludeTime) {
    return new Date(year, month, day);
  }

  const hours = zonedDate.getHours();
  const minutes = zonedDate.getMinutes();
  const seconds = zonedDate.getSeconds();
  const milliseconds = zonedDate.getMilliseconds();
  return new Date(year, month, day, hours, minutes, seconds, milliseconds);
}

export const calculateMonthsDifference = (
  a: Date,
  b: Date | null = newZoneDate()
) => {
  return Math.abs(differenceInCalendarMonths(a, b || newZoneDate()));
};

export const clubAge = () => {
  const current = newZoneDate();
  const clubStart = newZoneDate("09/01/2020");

  // Calculate the difference in years, months, and days
  const years = differenceInYears(current, clubStart);
  const months = differenceInMonths(current, clubStart) % 12; // Remove the years from months
  const days = differenceInDays(
    current,
    addMonths(clubStart, years * 12 + months)
  );

  // Construct the inYear string
  let inYear = `${years} yrs`;
  if (months) {
    inYear = `${inYear} ${months} mth`;
  }
  if (days) {
    inYear = `${inYear} ${days} day`;
  }

  // Total months difference
  const inMonth = differenceInMonths(current, clubStart);

  // Create the period string (e.g., "3 years ago")
  const periodString = formatDistance(clubStart, current, { addSuffix: true });

  return {
    calender: formatRelative(clubStart, current),
    periodString,
    inYear,
    inMonth,
    since: format(clubStart, "dd MMM yyyy"),
  };
};

export const dateFormat = (input: Date | number) => {
  return format(newZoneDate(input), "dd MMM yyyy");
};

export const displayDateTime = (input: Date = newZoneDate()) => {
  return format(newZoneDate(input), "dd MMM yyyy hh:mm a");
};

type DueDates = {
  nextDueDate: Date;
  recentDueDate: Date;
  monthsPassed: number;
};

export const fileDateTime = (input: Date = newZoneDate()) => {
  return format(newZoneDate(input), "dd_mm_yy_HH_mm");
};

export const newDate = (input: any = newZoneDate()) => {
  // Parse the date string as a Date object
  const parsedDate = parse(input, "MM/dd/yyyy", newZoneDate());

  // Convert the parsed date to the specified time zone
  const zonedDate = toZonedTime(parsedDate, timeZone);

  return zonedDate;
};

export const calculateTimePassed = (
  start: Date | string,
  end: Date | string
) => {
  const startDate = newZoneDate(start);
  const endDate = newZoneDate(end);
  // Calculate total months
  const monthsPassed = differenceInMonths(endDate, startDate);

  // Calculate remaining days
  const recentStartDate = addMonths(startDate, monthsPassed);
  const daysPassed = differenceInDays(endDate, recentStartDate);
  const nextStartDate = addMonths(startDate, monthsPassed + 1);

  return {
    monthsPassed: Math.abs(monthsPassed),
    daysPassed: Math.abs(daysPassed),
    recentStartDate,
    nextStartDate,
    startDate,
    endDate,
  };
};

export const getMonthsPassedString = (months: number, days: number) => {
  return months
    ? `${months} mons${days ? ` ${days} d` : ""}`
    : `${days ? ` ${days} d` : ""}`;
};

export const calculateDateDiff = (
  start: Date | string | number,
  end: Date | string | number
) => {
  const startDate = newZoneDate(start);
  const endDate = newZoneDate(end);
  // Calculate total months
  const monthsPassed = differenceInMonths(endDate, startDate);

  // Calculate remaining days
  const recentStartDate = addMonths(startDate, monthsPassed);
  const daysPassed = differenceInDays(endDate, recentStartDate);

  return {
    monthsPassed: Math.abs(monthsPassed),
    daysPassed: Math.abs(daysPassed),
    startDate,
    endDate,
    recentStartDate,
  };
};

export const memberMonthsPassedString = (start: Date | string) => {
  const startDate = newZoneDate(start);
  const endDate = newZoneDate();
  // Calculate total months
  const monthsPassed = differenceInMonths(endDate, startDate);

  // Calculate remaining days
  const recentStartDate = addMonths(startDate, monthsPassed);
  const daysPassed = differenceInDays(endDate, recentStartDate);

  return {
    monthsPassed: Math.abs(monthsPassed),
    daysPassed: Math.abs(daysPassed),
    monthsPassedString: getMonthsPassedString(
      Math.abs(monthsPassed),
      Math.abs(daysPassed)
    ),
  };
};
