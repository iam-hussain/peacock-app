import {
  format,
  parse,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  formatDistance,
  formatRelative,
  addMonths,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { differenceInCalendarMonths } from "date-fns";
const timeZone = "Asia/Kolkata";

export const newDate = (input: any = new Date()) => {
  // Parse the date string as a Date object
  const parsedDate = parse(input, "MM/dd/yyyy", new Date());

  // Convert the parsed date to the specified time zone
  const zonedDate = toZonedTime(parsedDate, timeZone);

  return zonedDate;
};
export const monthsDiff = (a: Date, b: Date) => {
  return differenceInCalendarMonths(a, b);
};

export const dateFormat = (input: Date) => {
  return format(new Date(input), "dd MMM yyyy");
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

export const displayDateTime = (input: Date = new Date()) => {
  return format(new Date(input), "dd MMM yyyy hh:mm a");
};

export const fileDateTime = (input: Date = new Date()) => {
  return format(new Date(input), "dd_mm_yy_HH_mm");
};
