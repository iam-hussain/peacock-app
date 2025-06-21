import { $Enums, PASSBOOK_TYPE } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

import {
  calculateDateDiff,
  calculateTimePassed,
  getMonthsPassedString,
  newZoneDate,
} from "./date";
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
  const startDate = newZoneDate(start);
  const endDate = newZoneDate(end || undefined);

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

export const bulkPassbookUpdate = async (
  items: PassbookToUpdate,
  maxRetries = 3,
  batchSize = 5
) => {
  const values = Array.from(items.values());

  if (values.length === 1) {
    const updated = await prisma.passbook.update(values[0]);
    return updated;
  }

  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize); // Create a batch of updates

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const operations = batch.map((value) => prisma.passbook.update(value));

        await prisma.$transaction(operations); // Execute all updates in the batch
        console.log(`Batch ${i / batchSize + 1} updated successfully`);
        break; // Exit retry loop if successful
      } catch (e: any) {
        if (e?.code === "P2034" && attempt < maxRetries - 1) {
          console.warn(
            `Retrying batch ${i / batchSize + 1} (${attempt + 1}/${maxRetries}) due to conflict...`
          );
          attempt++;
          continue;
        }
        console.error(`Batch ${i / batchSize + 1} update failed`);
        console.error(e);
        throw e; // Rethrow the error if retries are exhausted
      }
    }
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
      totalVendorProfit: 0,
    };
  }
  return {
    totalInvestment: 0,
    totalReturns: 0,
    accountBalance: 0,
    totalProfitAmount: 0,
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
      payload: { ...payload, ...calcData },
    },
  };
}

export function initializePassbookToUpdate(
  passbooks: {
    account: { id: string } | null;
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
        where: { id: passbook.id },
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
        where: { id: passbook.id },
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
      account: { select: { id: true } },
    },
  });
}

export function fetchAllLoanPassbook() {
  return prisma.passbook.findMany({
    where: { type: { in: ["CLUB", "MEMBER"] } },
    select: {
      id: true,
      type: true,
      payload: true,
      account: { select: { id: true } },
    },
  });
}

export const ONE_MONTH_RATE = 0.01;

export function calculateInterestByAmount(
  amount: number,
  start: Date | string | number,
  end: Date | string | number = newZoneDate()
) {
  const { monthsPassed, daysPassed, startDate, endDate, recentStartDate } =
    calculateDateDiff(start, end);

  const daysInMonth = newZoneDate(
    new Date(recentStartDate.getFullYear(), recentStartDate.getMonth() + 1, 0)
  ).getDate();

  const interestForMonths = Number(
    (amount * ONE_MONTH_RATE * monthsPassed).toFixed(2)
  );
  const interestPerDay = Number(
    ((amount * ONE_MONTH_RATE) / daysInMonth).toFixed(2)
  );
  const interestForDays = Number((interestPerDay * daysPassed).toFixed(2));

  const interestAmount = Math.round(interestForMonths + interestForDays);

  return {
    startDate,
    endDate,
    monthsPassed,
    daysPassed,
    interestAmount,
    monthsPassedString: getMonthsPassedString(monthsPassed, daysPassed),
    daysInMonth,
    interestForDays,
    interestPerDay,
  };
}
