/* eslint-disable unused-imports/no-unused-vars */
import { TRANSACTION_TYPE } from "@prisma/client";

import {
  ClubPassbookData,
  MemberPassbookData,
  VendorPassbookData,
} from "@/lib/type";

export type TransactionPassbookConfig = {
  [key in TRANSACTION_TYPE]: PassbookConfigAction;
};

export type PassbookRecord =
  | keyof MemberPassbookData
  | keyof VendorPassbookData
  | keyof ClubPassbookData;

export type PassbookConfigAction = {
  FROM?: {
    ADD?: Partial<
      Record<
        keyof MemberPassbookData | keyof VendorPassbookData,
        PassbookConfigActionValue
      >
    >;
    SUB?: Partial<
      Record<
        keyof MemberPassbookData | keyof VendorPassbookData,
        PassbookConfigActionValue
      >
    >;
  };
  TO?: {
    ADD?: Partial<
      Record<
        keyof MemberPassbookData | keyof VendorPassbookData,
        PassbookConfigActionValue
      >
    >;
    SUB?: Partial<
      Record<
        keyof MemberPassbookData | keyof VendorPassbookData,
        PassbookConfigActionValue
      >
    >;
  };
  CLUB?: {
    ADD?: Partial<Record<keyof ClubPassbookData, PassbookConfigActionValue>>;
    SUB?: Partial<Record<keyof ClubPassbookData, PassbookConfigActionValue>>;
  };
};

export type PassbookConfigActionValue = "AMOUNT" | "DEPOSIT_DIFF" | "TOTAL";

export const transactionPassbookSettings: TransactionPassbookConfig = {
  PERIODIC_DEPOSIT: {
    FROM: {
      ADD: {
        periodicDepositAmount: "AMOUNT",
        totalDepositAmount: "AMOUNT",
        accountBalance: "AMOUNT",
      },
    },
    TO: { ADD: { clubHeldAmount: "AMOUNT" } },
    CLUB: {
      ADD: {
        totalMemberPeriodicDeposits: "AMOUNT",
        currentClubBalance: "AMOUNT",
        netClubBalance: "AMOUNT",
      },
    },
  },
  OFFSET_DEPOSIT: {
    FROM: {
      ADD: {
        offsetDepositAmount: "AMOUNT",
        totalDepositAmount: "AMOUNT",
        accountBalance: "AMOUNT",
      },
    },
    TO: { ADD: { clubHeldAmount: "AMOUNT" } },
    CLUB: {
      ADD: {
        totalMemberOffsetDeposits: "AMOUNT",
        currentClubBalance: "AMOUNT",
        netClubBalance: "AMOUNT",
      },
    },
  },
  WITHDRAW: {
    FROM: { SUB: { clubHeldAmount: "TOTAL" } },
    TO: {
      ADD: {
        withdrawalAmount: "AMOUNT",
        profitWithdrawalAmount: "DEPOSIT_DIFF",
      },
      SUB: { accountBalance: "TOTAL" },
    },
    CLUB: {
      ADD: {
        totalMemberWithdrawals: "AMOUNT",
        totalMemberProfitWithdrawals: "DEPOSIT_DIFF",
      },
      SUB: { currentClubBalance: "TOTAL", netClubBalance: "TOTAL" },
    },
  },
  REJOIN: {
    FROM: {
      SUB: { withdrawalAmount: "AMOUNT" },
      ADD: { accountBalance: "AMOUNT" },
    },
    TO: { ADD: { clubHeldAmount: "AMOUNT" } },
    CLUB: {
      ADD: { currentClubBalance: "AMOUNT", netClubBalance: "AMOUNT" },
      SUB: { totalMemberWithdrawals: "AMOUNT" },
    },
  },
  FUNDS_TRANSFER: {
    FROM: { SUB: { clubHeldAmount: "AMOUNT" } },
    TO: { ADD: { clubHeldAmount: "AMOUNT" } },
    CLUB: {},
  },
  VENDOR_INVEST: {
    FROM: { SUB: { clubHeldAmount: "AMOUNT" } },
    TO: { ADD: { totalInvestment: "AMOUNT", accountBalance: "AMOUNT" } },
    CLUB: {
      ADD: { totalInvestment: "AMOUNT" },
      SUB: { currentClubBalance: "AMOUNT" },
    },
  },
  VENDOR_RETURNS: {
    FROM: {
      ADD: { totalReturns: "AMOUNT" },
      SUB: { accountBalance: "AMOUNT" },
    },
    TO: { ADD: { clubHeldAmount: "AMOUNT" } },
    CLUB: { ADD: { currentClubBalance: "AMOUNT", totalReturns: "AMOUNT" } },
  },
  LOAN_TAKEN: {
    FROM: { SUB: { clubHeldAmount: "AMOUNT" } },
    TO: { ADD: { totalLoanBalance: "AMOUNT", totalLoanTaken: "AMOUNT" } },
    CLUB: {
      ADD: { totalLoanBalance: "AMOUNT", totalLoanTaken: "AMOUNT" },
      SUB: { currentClubBalance: "AMOUNT" },
    },
  },
  LOAN_REPAY: {
    FROM: {
      ADD: { totalLoanRepay: "AMOUNT" },
      SUB: { totalLoanBalance: "AMOUNT" },
    },
    TO: { ADD: { clubHeldAmount: "AMOUNT" } },
    CLUB: {
      ADD: { totalLoanRepay: "AMOUNT", currentClubBalance: "AMOUNT" },
      SUB: { totalLoanBalance: "AMOUNT" },
    },
  },
  LOAN_INTEREST: {
    FROM: { ADD: { totalInterestPaid: "AMOUNT" } },
    TO: { ADD: { clubHeldAmount: "AMOUNT" } },
    CLUB: {
      ADD: { totalInterestPaid: "AMOUNT", currentClubBalance: "AMOUNT" },
    },
  },
};
