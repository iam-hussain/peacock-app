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

export const calculateMonthsDifference = (
  a: Date,
  b: Date | null = new Date()
) => {
  return Math.abs(differenceInCalendarMonths(a, b || new Date()));
};

export const clubAge = () => {
  const current = new Date();
  const clubStart = new Date("09/01/2020");

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
  return format(new Date(input), "dd MMM yyyy");
};

export const displayDateTime = (input: Date = new Date()) => {
  return format(new Date(input), "dd MMM yyyy hh:mm a");
};

type DueDates = {
  nextDueDate: Date;
  recentDueDate: Date;
  monthsPassed: number;
};

export const fileDateTime = (input: Date = new Date()) => {
  return format(new Date(input), "dd_mm_yy_HH_mm");
};

export const newDate = (input: any = new Date()) => {
  // Parse the date string as a Date object
  const parsedDate = parse(input, "MM/dd/yyyy", new Date());

  // Convert the parsed date to the specified time zone
  const zonedDate = toZonedTime(parsedDate, timeZone);

  return zonedDate;
};

export const calculateTimePassed = (
  start: Date | string,
  end: Date | string
) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
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
  };
};

export const getMonthsPassedString = (months: number, days: number) => {
  return months ? `${months} mons${days ? ` ${days} d` : ""}` : null;
};
