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

// Vendor Transaction Type Map
export const vendorTransactionTypeMap = {
  PERIODIC_INVEST: "Periodic Invest",
  INVEST: "Invest",
  PERIODIC_RETURN: "Periodic Returns",
  RETURNS: "Returns",
  PROFIT: "Profit",
  // EXPENSE (commented out in the enum, so not included here)
};

// Vendor Type Map
export const vendorTypeMap = {
  DEFAULT: "Default",
  CHIT: "Chit",
  LEND: "Loan",
  BANK: "Bank",
};
