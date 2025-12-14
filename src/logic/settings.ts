/* eslint-disable unused-imports/no-unused-vars */
import { TransactionType } from "@prisma/client";

import {
  ClubFinancialSnapshot,
  MemberFinancialSnapshot,
  VendorFinancialSnapshot,
} from "@/lib/validators/type";

export type TransactionPassbookConfig = {
  [key in TransactionType]: PassbookConfigAction;
};

export type PassbookRecord =
  | keyof MemberFinancialSnapshot
  | keyof VendorFinancialSnapshot
  | keyof ClubFinancialSnapshot;

type MemberOrVendorKeys =
  | keyof MemberFinancialSnapshot
  | keyof VendorFinancialSnapshot;

export type PassbookConfigAction = {
  FROM?: {
    ADD?: Partial<Record<MemberOrVendorKeys, PassbookConfigActionValue>>;
    SUB?: Partial<Record<MemberOrVendorKeys, PassbookConfigActionValue>>;
  };
  TO?: {
    ADD?: Partial<Record<MemberOrVendorKeys, PassbookConfigActionValue>>;
    SUB?: Partial<Record<MemberOrVendorKeys, PassbookConfigActionValue>>;
  };
  CLUB?: {
    ADD?: Partial<
      Record<keyof ClubFinancialSnapshot, PassbookConfigActionValue>
    >;
    SUB?: Partial<
      Record<keyof ClubFinancialSnapshot, PassbookConfigActionValue>
    >;
  };
};

export type PassbookConfigActionValue = "AMOUNT" | "DEPOSIT_DIFF" | "TOTAL";

export const transactionPassbookSettings: TransactionPassbookConfig = {
  PERIODIC_DEPOSIT: {
    FROM: {
      ADD: {
        periodicDepositsTotal: "AMOUNT",
        totalDeposits: "AMOUNT",
        memberBalance: "AMOUNT",
      },
    },
    TO: { ADD: { clubHeldBalance: "AMOUNT" } },
    CLUB: {
      ADD: {
        memberPeriodicDepositsTotal: "AMOUNT",
        availableCashBalance: "AMOUNT",
        netClubValue: "AMOUNT",
      },
    },
  },
  OFFSET_DEPOSIT: {
    FROM: {
      ADD: {
        offsetDepositsTotal: "AMOUNT",
        totalDeposits: "AMOUNT",
        memberBalance: "AMOUNT",
      },
    },
    TO: { ADD: { clubHeldBalance: "AMOUNT" } },
    CLUB: {
      ADD: {
        memberOffsetDepositsTotal: "AMOUNT",
        availableCashBalance: "AMOUNT",
        netClubValue: "AMOUNT",
      },
    },
  },
  WITHDRAW: {
    FROM: { SUB: { clubHeldBalance: "TOTAL" } },
    TO: {
      ADD: {
        withdrawalsTotal: "AMOUNT",
        profitWithdrawalsTotal: "DEPOSIT_DIFF",
      },
      SUB: { memberBalance: "TOTAL" },
    },
    CLUB: {
      ADD: {
        memberWithdrawalsTotal: "AMOUNT",
        memberProfitWithdrawalsTotal: "DEPOSIT_DIFF",
      },
      SUB: { availableCashBalance: "TOTAL", netClubValue: "TOTAL" },
    },
  },
  REJOIN: {
    FROM: {
      SUB: { withdrawalsTotal: "AMOUNT" },
      ADD: { memberBalance: "AMOUNT" },
    },
    TO: { ADD: { clubHeldBalance: "AMOUNT" } },
    CLUB: {
      ADD: { availableCashBalance: "AMOUNT", netClubValue: "AMOUNT" },
      SUB: { memberWithdrawalsTotal: "AMOUNT" },
    },
  },
  FUNDS_TRANSFER: {
    FROM: { SUB: { clubHeldBalance: "AMOUNT" } },
    TO: { ADD: { clubHeldBalance: "AMOUNT" } },
    CLUB: {},
  },
  VENDOR_INVEST: {
    FROM: { SUB: { clubHeldBalance: "AMOUNT" } },
    TO: { ADD: { investmentTotal: "AMOUNT", currentBalance: "AMOUNT" } },
    CLUB: {
      ADD: { vendorInvestmentTotal: "AMOUNT" },
      SUB: { availableCashBalance: "AMOUNT" },
    },
  },
  VENDOR_RETURNS: {
    FROM: {
      ADD: { returnsTotal: "AMOUNT" },
      SUB: { currentBalance: "AMOUNT" },
    },
    TO: { ADD: { clubHeldBalance: "AMOUNT" } },
    CLUB: {
      ADD: { availableCashBalance: "AMOUNT", vendorReturnsTotal: "AMOUNT" },
    },
  },
  LOAN_TAKEN: {
    FROM: { SUB: { clubHeldBalance: "AMOUNT" } },
    TO: { ADD: { loansOutstanding: "AMOUNT", loansPrincipalTaken: "AMOUNT" } },
    CLUB: {
      ADD: { loansOutstanding: "AMOUNT", loansPrincipalDisbursed: "AMOUNT" },
      SUB: { availableCashBalance: "AMOUNT" },
    },
  },
  LOAN_REPAY: {
    FROM: {
      ADD: { loansPrincipalRepaid: "AMOUNT" },
      SUB: { loansOutstanding: "AMOUNT" },
    },
    TO: { ADD: { clubHeldBalance: "AMOUNT" } },
    CLUB: {
      ADD: { loansPrincipalRepaid: "AMOUNT", availableCashBalance: "AMOUNT" },
      SUB: { loansOutstanding: "AMOUNT" },
    },
  },
  LOAN_INTEREST: {
    FROM: { ADD: { interestPaidTotal: "AMOUNT" } },
    TO: { ADD: { clubHeldBalance: "AMOUNT" } },
    CLUB: {
      ADD: { interestCollectedTotal: "AMOUNT", availableCashBalance: "AMOUNT" },
    },
  },
};
