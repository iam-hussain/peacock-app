import { newDate } from "./date";

type Stage = {
  amount: number;
  startDate: Date;
  endDate?: Date;
};

const alpha: Stage = {
  amount: 1000,
  startDate: newDate("09/01/2020"),
  endDate: newDate("08/31/2023"),
};

const bravo: Stage = {
  amount: 2000,
  startDate: newDate("09/01/2023"),
};

export const clubConfig = {
  startedAt: newDate("09/01/2020s"),
  stages: [alpha, bravo],
  alpha,
  bravo,
};
