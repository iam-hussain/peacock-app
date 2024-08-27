import { format, parse } from "date-fns";
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
