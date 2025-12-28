/* eslint-disable unused-imports/no-unused-vars */
import { TransactionType } from "@prisma/client";

import { newZoneDate } from "@/lib/core/date";

type Stage = { name: string; amount: number; startDate: Date; endDate?: Date };

const alpha: Stage = {
  name: "alpha",
  amount: 1000,
  startDate: newZoneDate("09/01/2020"),
  endDate: newZoneDate("09/01/2023"),
};

const bravo: Stage = {
  name: "bravo",
  amount: 2000,
  startDate: newZoneDate("08/31/2023"),
};

export const clubConfig = {
  startedAt: newZoneDate("09/01/2020"),
  stages: [alpha, bravo],
  alpha,
  bravo,
  dayInterestFrom: newZoneDate("06/01/2024"),
};

// Transaction Type Map
export const transactionTypeMap: { [key in TransactionType]: string } = {
  PERIODIC_DEPOSIT: "Member's Deposit",
  OFFSET_DEPOSIT: "Member's Offset Deposit",
  WITHDRAW: "Member's Withdrawal",
  REJOIN: "Member's Rejoin Deposit",
  FUNDS_TRANSFER: "Club Funds Transfer",
  VENDOR_INVEST: "Vendor Investment",
  VENDOR_RETURNS: "Vendor Return",
  LOAN_TAKEN: "Loan Taken",
  LOAN_REPAY: "Loan Repayment",
  LOAN_INTEREST: "Loan Interest",
};

// Transaction Type Human Map
export const transactionTypeHumanMap: { [key in TransactionType]: string } = {
  PERIODIC_DEPOSIT: "Member's Monthly Deposit",
  OFFSET_DEPOSIT: "Member's Offset Deposit",
  WITHDRAW: "Member's Withdrawal",
  REJOIN: "Member's Rejoin Deposit",
  FUNDS_TRANSFER: "Club Funds Transfer Between Members",
  VENDOR_INVEST: "Vendor Investment",
  VENDOR_RETURNS: "Vendor Return",
  LOAN_TAKEN: "Loan Given to Members",
  LOAN_REPAY: "Loan Repayment Collected from Members",
  LOAN_INTEREST: "Loan Interest Received from Members",
};

export const clubData = { sub: "Peacock Club", avatar: "/peacock_cash.png" };
