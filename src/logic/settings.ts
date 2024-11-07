import { ClubPassbookData, MemberPassbookData, VendorPassbookData } from "@/lib/type";
import { TRANSACTION_TYPE } from "@prisma/client";

export type TransactionPassbookConfig = {
  [key in TRANSACTION_TYPE]: PassbookConfigAction;
};

export type PassbookConfigAction = {
  "FROM" : {
    [key in "ADD" | "SUB"]?: {
      [key in keyof MemberPassbookData | keyof VendorPassbookData]?: PassbookConfigActionValue
    }
  },
  "TO" : {
    [key in "ADD" | "SUB"]?: {
      [key in keyof MemberPassbookData | keyof VendorPassbookData]?: PassbookConfigActionValue
    }
  },
  "CLUB" : {
    [key in "ADD" | "SUB"]?: {
      [key in keyof ClubPassbookData]?: PassbookConfigActionValue
    }
  }
}

export type PassbookConfigActionValue = "AMOUNT" | "TERM" | "PROFIT";


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
        accountBalance: "AMOUNT" },
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
    FROM: { SUB: { clubHeldAmount: "AMOUNT" } },
    TO: {
      ADD: { withdrawalAmount: "AMOUNT" },
      SUB: {
        accountBalance: "AMOUNT",
      },
    },
    CLUB: {
      ADD: { totalMemberWithdrawals: "AMOUNT" },
      SUB: {
        currentClubBalance: "AMOUNT",
        netClubBalance: "AMOUNT",
      },
    },
  },
  REJOIN: {
    FROM: {
      SUB: { withdrawalAmount: "AMOUNT" },
      ADD: {
        accountBalance: "AMOUNT",
      },
    },
    TO: { ADD: { clubHeldAmount: "AMOUNT" } },
    CLUB: {
      ADD: {
        currentClubBalance: "AMOUNT",
        netClubBalance: "AMOUNT",
      },
      SUB: { totalMemberWithdrawals: "AMOUNT" },
    },
  },
  FUNDS_TRANSFER: {
    FROM: {
      SUB: {
        clubHeldAmount: "AMOUNT",
      },
    },
    TO: {
      ADD: {
        clubHeldAmount: "AMOUNT",
      },
    },
    CLUB: {},
  },
  INVEST: {
    FROM: {
      SUB: {
        clubHeldAmount: "AMOUNT",
      },
    },
    TO: {
      ADD: {
        totalInvestment: "AMOUNT",
        accountBalance: "AMOUNT",
      },
    },
    CLUB: {
      ADD: {
        totalInvestment: "AMOUNT",
      },
      SUB: {
        currentClubBalance: "AMOUNT",
      },
    },
  },
  RETURNS: {
    FROM: {
      ADD: {
        totalReturns: "AMOUNT",
      },
      SUB: {
        accountBalance: "AMOUNT",
      }
    },
    TO: {
      ADD: {
        clubHeldAmount: "AMOUNT",
      },
    },
    CLUB: {
      ADD: {
        currentClubBalance: "AMOUNT",
        totalReturns: "AMOUNT"
      },
    },
  },
  PROFIT: {
    FROM: {
      ADD: {
        profitEarned: "AMOUNT",
      },
    },
    TO: {
      ADD: {
        clubHeldAmount: "AMOUNT",
      },
    },
    CLUB: {
      ADD: {
        totalProfit: "AMOUNT",
        currentClubBalance: "AMOUNT",
        netClubBalance: "AMOUNT",
      },
    },
  },
};