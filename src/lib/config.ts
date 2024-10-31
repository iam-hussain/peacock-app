import { TRANSACTION_TYPE } from "@prisma/client";

type Stage = {
  name: string;
  amount: number;
  startDate: Date;
  endDate?: Date;
};

const alpha: Stage = {
  name: "alpha",
  amount: 1000,
  startDate: new Date("09/01/2020"),
  endDate: new Date("09/01/2023"),
};

const bravo: Stage = {
  name: "bravo",
  amount: 2000,
  startDate: new Date("08/31/2023"),
};

export const clubConfig = {
  startedAt: new Date("09/01/2020"),
  stages: [alpha, bravo],
  alpha,
  bravo,
  dayInterestFrom: new Date("06/01/2024"),
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
  PERIODIC_DEPOSIT: "Members Deposit",
  OFFSET_DEPOSIT: "Offset Deposit",
  WITHDRAW: "Members Withdraw",
  REJOIN: "Members Rejoin Deposit",
  FUNDS_TRANSFER: "Club Funds Transfer",
  INVEST: "Investment/Loan",
  RETURNS: "Return/Repayment",
  PROFIT: "Profit/Interest",
};

// Transaction Type Map
export const transactionTypeHumanMap: { [key in TRANSACTION_TYPE]: string } = {
  PERIODIC_DEPOSIT: "Member's Monthly Deposit",
  OFFSET_DEPOSIT: "Member's Offset Deposit",
  WITHDRAW: "Member's Withdrawal",
  REJOIN: "Member's Rejoin Deposit",
  FUNDS_TRANSFER: "Club Funds Transfer Between Members",
  INVEST: "Investment/Loan to Vendor or Member",
  RETURNS: "Return/Repayment from Vendor or Member",
  PROFIT: "Profit/Interest Received from Vendor or Member",
};
