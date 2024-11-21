import { $Enums, PASSBOOK_TYPE } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

import { calculateTimePassed, getMonthsPassedString } from "./date";
import {
  ClubPassbookData,
  MemberPassbookData,
  VendorPassbookData,
} from "./type";

import prisma from "@/db";

export const chitCalculator = (
  start: string | Date,
  end?: string | Date | null
) => {
  // Input values
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  const { nextStartDate, monthsPassed, daysPassed } = calculateTimePassed(
    startDate,
    endDate
  );

  return {
    monthsPassed,
    daysPassed,
    nextDueDate: nextStartDate.getTime(),
    monthsPassedString: getMonthsPassedString(monthsPassed, daysPassed),
  };
};

type PassbookToUpdate = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;

export const bulkPassbookUpdate = async (items: PassbookToUpdate) => {
  try {
    await prisma.$transaction(
      Array.from(items, ([_, value]) => value).map(prisma.passbook.update)
    );
    console.log("Bulk passbook updated successfully");
  } catch (e) {
    console.error("Bulk passbook updated failed");
    console.error(e);
  }
};

export const getDefaultPassbookData = (
  type: PASSBOOK_TYPE = "MEMBER"
): ClubPassbookData | MemberPassbookData | VendorPassbookData => {
  if (type === "MEMBER") {
    return {
      periodicDepositAmount: 0,
      offsetDepositAmount: 0,
      totalDepositAmount: 0,
      withdrawalAmount: 0,
      profitWithdrawalAmount: 0,
      accountBalance: 0,
      clubHeldAmount: 0,
      totalVendorOffsetAmount: 0,
      totalLoanOffsetAmount: 0,
      totalLoanTaken: 0,
      totalLoanRepay: 0,
      totalLoanBalance: 0,
      totalInterestPaid: 0,
    };
  }
  if (type === "CLUB") {
    return {
      totalMemberPeriodicDeposits: 0,
      totalMemberOffsetDeposits: 0,
      totalMemberWithdrawals: 0,
      totalMemberProfitWithdrawals: 0,
      currentClubBalance: 0,
      netClubBalance: 0,
      totalInvestment: 0,
      totalReturns: 0,
      totalProfit: 0,
      totalLoanTaken: 0,
      totalLoanRepay: 0,
      totalLoanBalance: 0,
      totalInterestPaid: 0,
      totalLoanProfit: 0,
      totalVendorProfit: 0,
      loanOffsetPaid: 0,
      loanOffsetBalance: 0,
      vendorOffsetPaid: 0,
      vendorOffsetBalance: 0,
      totalVendorOffsetAmount: 0,
      totalLoanOffsetAmount: 0,
    };
  }
  return {
    totalInvestment: 0,
    totalReturns: 0,
    accountBalance: 0,
    totalProfitAmount: 0,
    totalOffsetAmount: 0,
    includedMembersCount: 0,
    excludedMembersCount: 0,
    memberProfitAmount: 0,
  };
};

export function setPassbookUpdateQuery(
  passbook: Parameters<typeof prisma.passbook.update>[0],
  calcData: Partial<ClubPassbookData | MemberPassbookData | VendorPassbookData>,
  passData: Partial<any> = {}
): Parameters<typeof prisma.passbook.update>[0] {
  const payload: any = passbook.data.payload || {};
  return {
    ...passbook,
    data: {
      ...passbook.data,
      ...passData,
      payload: {
        ...payload,
        ...calcData,
      },
    },
  };
}

export function initializePassbookToUpdate(
  passbooks: {
    account: {
      id: string;
    } | null;
    id: string;
    type: $Enums.PASSBOOK_TYPE;
    payload: JsonValue;
  }[],
  isClean: boolean = true
): PassbookToUpdate {
  let passbookToUpdate: PassbookToUpdate = new Map();

  for (let passbook of passbooks) {
    if (passbook.account?.id && passbook.type !== "CLUB") {
      passbookToUpdate.set(passbook.account?.id, {
        where: {
          id: passbook.id,
        },
        data: {
          payload: isClean
            ? getDefaultPassbookData(passbook.type)
            : (passbook.payload as any),
          loanHistory: [],
        },
      });
    }
    if (passbook.type === "CLUB") {
      passbookToUpdate.set("CLUB", {
        where: {
          id: passbook.id,
        },
        data: {
          payload: isClean
            ? getDefaultPassbookData(passbook.type)
            : (passbook.payload as any),
          loanHistory: [],
        },
      });
    }
  }
  return passbookToUpdate;
}

export function fetchAllPassbook() {
  return prisma.passbook.findMany({
    select: {
      id: true,
      type: true,
      payload: true,
      account: {
        select: {
          id: true,
        },
      },
    },
  });
}

const ONE_MONTH_RATE = 0.01;

export function calculateInterestByAmount(
  amount: number,
  start: Date | string,
  end: Date | string = new Date()
) {
  const { monthsPassed, daysPassed, recentStartDate } = calculateTimePassed(
    start,
    end
  );

  const daysInMonth = new Date(
    recentStartDate.getFullYear(),
    recentStartDate.getMonth() + 1,
    0
  ).getDate();

  const interestForMonths = amount * ONE_MONTH_RATE * monthsPassed;
  const interestPerDay = (amount * ONE_MONTH_RATE) / daysInMonth;
  const interestForDays = amount * ONE_MONTH_RATE * (daysPassed / daysInMonth);

  const interestAmount = interestForMonths + interestForDays;

  return {
    interestAmount,
    monthsPassed,
    daysPassed,
    daysInMonth,
    monthsPassedString: getMonthsPassedString(monthsPassed, daysPassed),
    interestForDays,
    interestPerDay,
  };
}
