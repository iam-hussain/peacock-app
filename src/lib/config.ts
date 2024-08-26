import { newDate } from "./date";

type Stage = {
  amount: number;
  startDate: Date;
  endDate?: Date;
};

const alpha: Stage = {
  amount: 1000,
  startDate: new Date("09/01/2020"),
  endDate: new Date("09/01/2023"),
};

const bravo: Stage = {
  amount: 2000,
  startDate: new Date("09/01/2023"),
};

export const clubConfig = {
  startedAt: new Date("09/01/2020s"),
  stages: [alpha, bravo],
  alpha,
  bravo,
};


export const transactionMethodMap =  {
  CASH: "Cash",
  ACCOUNT: "Account",
  UPI: "UPI",
  BANK: "Bank",
  CHEQUE: "Cheque",
}
export const memberTransactionTypeMap =  {
  PERIODIC_DEPOSIT: "Deposit",
  OFFSET_DEPOSIT: "Deposit Offset",
  WITHDRAW: "Withdraw",
  REJOIN: "Rejoin",
  FUNDS_TRANSFER: "Transfer",
}