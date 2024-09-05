import {
  MEMBER_TRANSACTION_TYPE,
  Passbook,
  VENDOR_TRANSACTION_TYPE,
} from "@prisma/client";

export type MemberPassbookConfig = {
  [key in MEMBER_TRANSACTION_TYPE]: {
    [key in "FROM" | "TO" | "CLUB"]: PassbookConfigAction;
  };
};
export type PassbookConfigAction = {
  [key in "ADD" | "SUB"]?: {
    [key in keyof Passbook]?: PassbookConfigActionValue;
  };
};

export type PassbookConfigActionValue = "amount" | "term";

export type VendorPassbookConfig = {
  [key in VENDOR_TRANSACTION_TYPE]: {
    [key in "MEMBER" | "VENDOR" | "CLUB"]: PassbookConfigAction;
  };
};

export const memberTransactionPassbookSettings: MemberPassbookConfig = {
  PERIODIC_DEPOSIT: {
    FROM: {
      ADD: {
        periodIn: "amount",
        in: "amount",
        balance: "amount",
        currentTerm: "term",
      },
    },
    TO: { ADD: { fund: "amount" } },
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
    FROM: {
      ADD: { offsetIn: "amount", in: "amount", balance: "amount" },
    },
    TO: { ADD: { fund: "amount" } },
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
    FROM: { SUB: { fund: "amount" } },
    TO: {
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
    FROM: {
      SUB: { out: "amount" },
      ADD: {
        balance: "amount",
      },
    },
    TO: { ADD: { fund: "amount", balance: "amount" } },
    CLUB: {
      ADD: {
        balance: "amount",
        fund: "amount",
      },
      SUB: { out: "amount" },
    },
  },
  FUNDS_TRANSFER: {
    FROM: {
      SUB: {
        fund: "amount",
      },
    },
    TO: {
      ADD: {
        fund: "amount",
      },
    },
    CLUB: {},
  },
};

export const vendorTransactionPassbookSettings: VendorPassbookConfig = {
  PERIODIC_INVEST: {
    MEMBER: {
      SUB: {
        fund: "amount",
      },
    },
    VENDOR: {
      ADD: {
        currentTerm: "term",
        periodIn: "amount",
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
  PERIODIC_RETURN: {
    MEMBER: {
      ADD: {
        fund: "amount",
      },
    },
    VENDOR: {
      ADD: {
        currentTerm: "term",
        offsetIn: "amount",
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
