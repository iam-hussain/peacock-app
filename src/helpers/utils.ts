import moment from "moment-timezone";
import _ from "lodash";
import configContext from "@/config";

moment.tz.setDefault("Asia/Kolkata");

export const getValidateUniqueKey = (input: string) =>
  `${input
    .toLowerCase()
    .replaceAll(/[^a-zA-Z]/g, "_")
    .replaceAll(" ", "_")}_${Math.floor(Math.random() * 10 + 1)}`;

export const getValidDate = (date: any) =>
  date && moment(date).isValid() ? new Date(date) : new Date();

export const getSecondDiff = (input: any = new Date()) =>
  moment(new Date(), "DD/MM/YYYY HH:mm:ss").diff(
    moment(getValidDate(input), "DD/MM/YYYY HH:mm:ss")
  );

export const getDiffMoment = (input: any = new Date()) => {
  return moment.duration(
    moment(new Date())
      .startOf("day")
      .diff(moment(getValidDate(input)).startOf("day"))
  );
};

export const getMonthsDiff = (input: any = new Date()) => {
  const diff = getDiffMoment(input);
  const monthDiff = Number(diff.asMonths().toString().split(".")[0]);
  const isPastDate = moment(getValidDate(input))
    .add(monthDiff, "months")
    .isBefore(new Date());

  return isPastDate ? monthDiff : monthDiff - 1;
};

export const getMonthYear = (input: any = new Date()) => {
  const date = moment(input);
  return date.format("MMM YYYY");
};

export const getDueAmount = (input: number) => {
  return input / 100;
};

export const getNextDue = (input: any = new Date()) => {
  const monthDiff = getMonthsDiff(getValidDate(input));

  const nextDate = moment(getValidDate(input)).add(monthDiff + 1, "months");
  const prevDate = moment(getValidDate(input)).add(monthDiff, "months");
  const calenderNext = nextDate.calendar().split("at");
  const calenderPrev = prevDate.calendar().split("at");

  let lastDate = {
    lastDue: prevDate.format("DD MMM YYYY"),
    lastDueHighlight: false,
    prevDate: new Date(prevDate.toISOString()),
  };

  if (calenderPrev.length > 1) {
    lastDate = {
      lastDue: calenderPrev[0],
      lastDueHighlight: true,
      prevDate: new Date(prevDate.toISOString()),
    };
  }

  if (nextDate.format("DD MMM YYYY") === moment().format("DD MMM YYYY")) {
    return {
      lastDue: "Today",
      lastDueHighlight: true,
      nextDue: nextDate.format("DD MMM YYYY"),
      calenderNext: "Today",
      nextDueHighlight: true,
      nextDate: new Date(nextDate.toISOString()),
      prevDate: new Date(prevDate.toISOString()),
    };
  }

  if (calenderNext.length > 1) {
    return {
      ...lastDate,
      nextDue: nextDate.format("DD MMM YYYY"),
      calenderNext: calenderNext[0],
      nextDueHighlight: true,
      nextDate: new Date(nextDate.toISOString()),
    };
  }

  return {
    ...lastDate,
    nextDue: nextDate.format("DD MMM YYYY"),
    calenderNext: "",
    nextDueHighlight: false,
    nextDate: new Date(nextDate.toISOString()),
  };
};

export const formatMoney = (input: any | undefined = 0) => {
  return `${Number(Number(input).toFixed(2)).toLocaleString("en-IN") || 0} ₹`;
};

export const formatNumber = (input: any | undefined = 0) => {
  return Number(Number(input).toFixed(2)) || 0;
};

export const formatDate = (input: any = new Date()) => {
  const date = moment(getValidDate(input));
  return date.format("DD MMM YYYY");
};

export const formatDateFile = (input: any = new Date()) => {
  const date = moment(getValidDate(input));
  return date.format("DD-MM-YYYY");
};

export const formatDateTime = (input: any = new Date()) => {
  const date = moment(getValidDate(input));
  return date.format("MMMM Do YYYY, h:mm:ss a");
};

export const getValidNumber = (input: any | undefined = 0) => {
  return isNaN(Number(input)) ? 0 : Number(input);
};

export const getFirstLetterUpperCase = (str: string) => {
  const spaced = str.split("_").join(" ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.substring(1);
};

export function numDifferentiation(value: number) {
  const val = Math.abs(value);
  if (val >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `${(value / 100000).toFixed(2)} Lac`;
  return value;
}

export const validateLocalDate = (input: string) => {
  const data = moment(input, "DD/MM/YYYY");
  if (data.isValid()) {
    return new Date(data.toString());
  }
  return new Date();
};

export const formatLocalDate = (input: any = new Date()) => {
  const date = moment(getValidDate(input));
  return date.format("DD/MM/YYYY");
};

export const pickValidInObject = (obj: any) => {
  return _.pickBy(obj, (e: any) => {
    if (typeof e === "string" && e === "") {
      return false;
    }
    return true;
  });
};

export const responseData = ({
  success = true,
  message = "default",
  data = {},
  errors = {},
}: {
  success?: boolean;
  message?: keyof typeof configContext.message;
  data?: any;
  errors?: any;
}) => {
  return {
    success,
    message: `${configContext.message[message]}${
      data?.id ? ` ID:${data?.id}` : ""
    }`,
    data,
    errors,
  };
};
