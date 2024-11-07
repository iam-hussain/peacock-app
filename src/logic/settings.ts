import { Passbook, TRANSACTION_TYPE } from "@prisma/client";

export type TransactionPassbookConfig = {
  [key in TRANSACTION_TYPE]: {
    [key in "MEMBER" | "VENDOR" | "CLUB"]: PassbookConfigAction;
  };
};
export type PassbookConfigAction = {
  [key in "ADD" | "SUB"]?: {
    [key in keyof Passbook]?: PassbookConfigActionValue;
  };
};

export type PassbookConfigActionValue = "amount" | "term";

export const transactionPassbookSettings: TransactionPassbookConfig = {
  PERIODIC_DEPOSIT: {
    MEMBER: {
      ADD: {
        periodIn: "amount",
        in: "amount",
        balance: "amount",
        currentTerm: "term",
      },
    },
    VENDOR: { ADD: { fund: "amount" } },
    CLUB: {
      ADD: {
        periodIn: "amount",
        in: "amount",
        balance: "amount",
        fund: "amount",
      },
    },
  },
  OFFSET_DEPOSIT: {
    MEMBER: {
      ADD: { offsetIn: "amount", in: "amount", balance: "amount" },
    },
    VENDOR: { ADD: { fund: "amount" } },
    CLUB: {
      ADD: {
        offsetIn: "amount",
        in: "amount",
        balance: "amount",
        fund: "amount",
      },
    },
  },
  WITHDRAW: {
    VENDOR: { SUB: { fund: "amount" } },
    MEMBER: {
      ADD: { out: "amount" },
      SUB: {
        balance: "amount",
      },
    },
    CLUB: {
      ADD: { out: "amount" },
      SUB: {
        balance: "amount",
        fund: "amount",
      },
    },
  },
  REJOIN: {
    MEMBER: {
      SUB: { out: "amount" },
      ADD: {
        balance: "amount",
      },
    },
    VENDOR: { ADD: { fund: "amount", balance: "amount" } },
    CLUB: {
      ADD: {
        balance: "amount",
        fund: "amount",
      },
      SUB: { out: "amount" },
    },
  },
  FUNDS_TRANSFER: {
    MEMBER: {
      SUB: {
        fund: "amount",
      },
    },
    VENDOR: {
      ADD: {
        fund: "amount",
      },
    },
    CLUB: {},
  },
  INVEST: {
    MEMBER: {
      SUB: {
        fund: "amount",
      },
    },
    VENDOR: {
      ADD: {
        in: "amount",
        fund: "amount",
      },
      SUB: {
        returns: "amount",
      },
    },
    CLUB: {
      SUB: {
        balance: "amount",
      },
    },
  },
  RETURNS: {
    MEMBER: {
      ADD: {
        fund: "amount",
      },
    },
    VENDOR: {
      ADD: {
        out: "amount",
        balance: "amount",
        returns: "amount",
      },
    },
    CLUB: {
      ADD: {
        balance: "amount",
      },
    },
  },
  PROFIT: {
    MEMBER: {
      ADD: {
        fund: "amount",
      },
    },
    VENDOR: {
      ADD: {
        out: "amount",
        balance: "amount",
      },
    },
    CLUB: {
      ADD: {
        balance: "amount",
      },
    },
  },
};



export const transactionPassbookSettings: TransactionPassbookConfig = {
  PERIODIC_DEPOSIT: {
    MEMBER: {
      ADD: {
        deposit: "amount",
        totalDeposit: "amount",
        currentBalance: "amount",
      },
    },
    VENDOR: { ADD: { clubFund: "amount" } },
    CLUB: {
      ADD: {
        periodIn: "amount",
        in: "amount",
        balance: "amount",
        fund: "amount",
      },
    },
  },
  OFFSET_DEPOSIT: {
    MEMBER: {
      ADD: { offsetIn: "amount", in: "amount", balance: "amount" },
    },
    VENDOR: { ADD: { fund: "amount" } },
    CLUB: {
      ADD: {
        offsetIn: "amount",
        in: "amount",
        balance: "amount",
        fund: "amount",
      },
    },
  },
  WITHDRAW: {
    VENDOR: { SUB: { fund: "amount" } },
    MEMBER: {
      ADD: { out: "amount" },
      SUB: {
        balance: "amount",
      },
    },
    CLUB: {
      ADD: { out: "amount" },
      SUB: {
        balance: "amount",
        fund: "amount",
      },
    },
  },
  REJOIN: {
    MEMBER: {
      SUB: { out: "amount" },
      ADD: {
        balance: "amount",
      },
    },
    VENDOR: { ADD: { fund: "amount", balance: "amount" } },
    CLUB: {
      ADD: {
        balance: "amount",
        fund: "amount",
      },
      SUB: { out: "amount" },
    },
  },
  FUNDS_TRANSFER: {
    MEMBER: {
      SUB: {
        fund: "amount",
      },
    },
    VENDOR: {
      ADD: {
        fund: "amount",
      },
    },
    CLUB: {},
  },
  INVEST: {
    MEMBER: {
      SUB: {
        fund: "amount",
      },
    },
    VENDOR: {
      ADD: {
        in: "amount",
        fund: "amount",
      },
      SUB: {
        returns: "amount",
      },
    },
    CLUB: {
      SUB: {
        balance: "amount",
      },
    },
  },
  RETURNS: {
    MEMBER: {
      ADD: {
        fund: "amount",
      },
    },
    VENDOR: {
      ADD: {
        out: "amount",
        balance: "amount",
        returns: "amount",
      },
    },
    CLUB: {
      ADD: {
        balance: "amount",
      },
    },
  },
  PROFIT: {
    MEMBER: {
      ADD: {
        fund: "amount",
      },
    },
    VENDOR: {
      ADD: {
        out: "amount",
        balance: "amount",
      },
    },
    CLUB: {
      ADD: {
        balance: "amount",
      },
    },
  },
};