/* eslint-disable unused-imports/no-unused-vars */
import { TRANSACTION_TYPE } from "@prisma/client";

import { newZoneDate } from "./date";

type Stage = {
  name: string;
  amount: number;
  startDate: Date;
  endDate?: Date;
};

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

// Member Transaction Type Map
export const memberTransactionTypeMap = {
  PERIODIC_DEPOSIT: "Periodic Deposit",
  OFFSET_DEPOSIT: "Offset Deposit",
  WITHDRAW: "Withdraw",
  REJOIN: "Rejoin",
  FUNDS_TRANSFER: "Funds Transfer",
};

// Member Vendor Role Map
export const memberVendorRoleMap = {
  DEFAULT: "Default",
  MEDIATOR: "Mediator",
  SELF: "Self",
};

// Passbook Type Map
export const passbookTypeMap = {
  MEMBER: "Member",
  VENDOR: "Vendor",
  CLUB: "Club",
};

// Period Map
export const periodMap = {
  NONE: "None",
  DAY: "Day",
  WEEK: "Week",
  MONTH: "Month",
  YEAR: "Year",
};

export const transactionMethodMap = {
  CASH: "Cash",
  ACCOUNT: "Account",
  UPI: "UPI",
  BANK: "Bank",
  CHEQUE: "Cheque",
};

// Vendor Type Map
export const vendorTypeMap: any = {
  DEFAULT: "Default",
  CHIT: "Chit",
  LEND: "Loan",
  BANK: "Bank",
};

// Vendor Type Map
export const vendorCreateTypeMap = {
  DEFAULT: "Default",
  CHIT: "Chit",
  BANK: "Bank",
};

// Vendor Type Map
export const vendorTypeTransactionMap = {
  DEFAULT: "Default/Chit",
  LEND: "Member Loan",
};

// Transaction Type Map
export const transactionTypeMap: { [key in TRANSACTION_TYPE]: string } = {
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
export const transactionTypeHumanMap: { [key in TRANSACTION_TYPE]: string } = {
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
