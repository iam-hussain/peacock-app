import type { TRANSACTION_MODE } from "@prisma/client";

export type PassbookConfig = {
  settings: {
    [key in TRANSACTION_MODE]?: {
      [key in "FROM" | "TO" | "GROUP" | "CLUB"]?: {
        [key in "ADD" | "SUB"]?: {
          [key in Passbook_Settings_Keys]?:
            | "amount"
            | "balance"
            | "profit"
            | "one";
        };
      };
    };
  };
};

export type Passbook_Settings_Keys = any;

export const passbookConfig: PassbookConfig = {
  settings: {
    INTER_CASH_TRANSFER: {
      FROM: {
        SUB: {
          funds: "amount",
        },
      },
      TO: {
        ADD: {
          funds: "amount",
        },
      },
    },
    MEMBERS_PERIODIC_DEPOSIT: {
      FROM: {
        ADD: {
          "in.term": "amount",
          "in.total": "amount",
          balance: "amount",
        },
      },
      TO: {
        ADD: {
          funds: "amount",
        },
      },
      CLUB: {
        ADD: {
          "in.term": "amount",
          "in.total": "amount",
          balance: "amount",
          funds: "amount",
        },
      },
    },
    NEW_MEMBER_PAST_TALLY: {
      FROM: {
        ADD: {
          "in.offset": "amount",
          "in.total": "amount",
          balance: "amount",
        },
      },
      TO: {
        ADD: {
          funds: "amount",
        },
      },
      CLUB: {
        ADD: {
          "in.offset": "amount",
          "in.total": "amount",
          balance: "amount",
          funds: "amount",
        },
      },
    },
    VENDOR_PERIODIC_INVEST: {
      FROM: {
        SUB: {
          funds: "amount",
        },
      },
      TO: {
        ADD: {
          "out.term": "amount",
          "out.total": "amount",
          termCount: "one",
          funds: "amount",
        },
      },
      CLUB: {
        ADD: {
          "out.term": "amount",
          "out.total": "amount",
          termCount: "one",
        },
        SUB: {
          funds: "amount",
        },
      },
    },
    VENDOR_INVEST: {
      FROM: {
        SUB: {
          funds: "amount",
        },
      },
      TO: {
        ADD: {
          invest: "amount",
          "out.total": "amount",
          funds: "amount",
        },
      },
      CLUB: {
        ADD: {
          invest: "amount",
          "out.total": "amount",
        },
        SUB: {
          funds: "amount",
        },
      },
    },
    VENDOR_PERIODIC_RETURN: {
      FROM: {
        ADD: {
          "in.term": "amount",
          "in.total": "amount",
          funds: "amount",
          balance: "amount",
          "profit.value": "profit",
          "profit.total": "profit",
          termCount: "one",
        },
      },
      TO: {
        ADD: {
          funds: "amount",
        },
      },
      CLUB: {
        ADD: {
          "in.term": "amount",
          "in.total": "amount",
          funds: "amount",
          "profit.value": "profit",
          "profit.total": "profit",
          termCount: "one",
        },
      },
    },
    VENDOR_RETURN: {
      FROM: {
        ADD: {
          returns: "amount",
          "in.total": "amount",
          funds: "amount",
          balance: "amount",
          "profit.value": "profit",
          "profit.total": "profit",
        },
      },
      TO: {
        ADD: {
          funds: "amount",
        },
      },
      CLUB: {
        ADD: {
          returns: "amount",
          "in.total": "amount",
          funds: "amount",
          "profit.value": "profit",
          "profit.total": "profit",
        },
      },
    },
    OTHER_EXPENDITURE: {
      FROM: {
        SUB: {
          funds: "amount",
        },
      },
      TO: {
        SUB: {
          "out.value": "amount",
          "out.total": "amount",
          balance: "amount",
        },
      },
      CLUB: {
        SUB: {
          "out.value": "amount",
          "out.total": "amount",
          balance: "amount",
          funds: "amount",
        },
      },
    },
    MEMBERS_WITHDRAW: {
      FROM: {
        SUB: {
          funds: "amount",
        },
      },
      TO: {
        ADD: {
          "out.value": "amount",
          "out.total": "amount",
        },
        SUB: {
          balance: "amount",
        },
      },
      CLUB: {
        ADD: {
          "out.value": "amount",
          "out.total": "amount",
        },
        SUB: {
          balance: "amount",
          funds: "amount",
        },
      },
    },
    MEMBERS_WITHDRAW_PROFIT: {
      FROM: {
        SUB: {
          funds: "amount",
        },
      },
      TO: {
        ADD: {
          "profit.offset": "amount",
          "out.total": "amount",
        },
        SUB: {
          balance: "amount",
        },
      },
      CLUB: {
        ADD: {
          "profit.offset": "amount",
          "out.total": "amount",
        },
        SUB: {
          balance: "amount",
          funds: "amount",
        },
      },
    },
    MEMBERS_REPAY_PROFIT: {
      FROM: {
        ADD: {
          balance: "amount",
        },
        SUB: {
          "profit.offset": "amount",
          "out.total": "amount",
        },
      },
      TO: {
        ADD: {
          funds: "amount",
        },
      },

      CLUB: {
        ADD: {
          "profit.offset": "amount",
          "out.total": "amount",
        },
        SUB: {
          balance: "amount",
          funds: "amount",
        },
      },
    },
  },
};
