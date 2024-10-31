import { Transaction } from "@prisma/client";

import prisma from "@/db";
import { calculateTimePassed } from "@/lib/date";

export function calculateInterest(transactions: Transaction[]) {
  const ONE_MONTH_RATE = 0.01;
  let invested = 0;
  let returned = 0;
  let balance = 0;
  let lastTransactionDate: any;
  let interestPaid = 0;
  let totalInterest = 0;
  let interestBalance = 0;
  let interestDetails = [];

  transactions.forEach((transaction) => {
    const { transactionType, amount, transactionAt } = transaction;
    const date = new Date(transactionAt);

    if (transactionType === "INVEST") {
      invested += amount;
      balance += amount;

      if (!lastTransactionDate) {
        lastTransactionDate = date.toISOString().split("T")[0];
      }
    }
    if (transactionType === "RETURNS") {
      const { monthsPassed, daysPassed } = calculateTimePassed(
        new Date(lastTransactionDate),
        date
      );

      // Interest for months and days
      const interestForMonths = balance * ONE_MONTH_RATE * monthsPassed;
      const interestForDays = balance * ONE_MONTH_RATE * (daysPassed / 30);
      const interestAmount = interestForMonths + interestForDays;

      totalInterest += interestAmount;

      interestDetails.push({
        active: false,
        amount: balance,
        startDate: lastTransactionDate,
        endDate: date.toISOString().split("T")[0],
        interestAmount,
        monthsPassed,
        daysPassed,
      });

      lastTransactionDate = date.toISOString().split("T")[0];

      balance -= amount;
      returned += amount;

      if (returned === invested) {
        lastTransactionDate = null;
      }
    }

    if (transactionType === "PROFIT") {
      interestPaid += amount;
    }
  });

  if (balance > 0 && lastTransactionDate) {
    const { monthsPassed, daysPassed } = calculateTimePassed(
      new Date(lastTransactionDate),
      new Date()
    );
    // Interest for months and days
    const interestForMonths = balance * ONE_MONTH_RATE * monthsPassed;
    const interestAmount = interestForMonths; //  + interestForDays;

    interestDetails.push({
      active: true,
      amount: balance,
      startDate: lastTransactionDate,
      interestAmount: interestAmount,
      monthsPassed,
      daysPassed,
    });
  }

  interestBalance = totalInterest - interestPaid;

  return {
    invested,
    returned,
    interestPaid,
    balance: Math.abs(balance),
    interestBalance,
    lastTransactionDate,
    totalInterest,
    interestDetails,
  };
}

export async function updateAllLoanInterest() {
  const transaction = await prisma.transaction.findMany({
    where: {
      vendor: {
        type: "LEND",
      },
    },
    orderBy: {
      transactionAt: "asc",
    },
  });

  const transactionsByVendor: { [key in string]: Transaction[] } = {};

  transaction.forEach((e) => {
    if (!transactionsByVendor[e.vendorId]) {
      transactionsByVendor[e.vendorId] = [];
    }
    transactionsByVendor[e.vendorId].push(e);
  });

  const updatedPassbooks = Object.entries(transactionsByVendor).map(
    ([vendorId, vendorTransactions]) => {
      const interestData = calculateInterest(vendorTransactions);
      return {
        vendorId,
        in: interestData.invested,
        out: interestData.returned,
        returns: interestData.interestPaid,
        offset: interestData.balance,
        balance: interestData.interestBalance || 0,
        date: interestData.lastTransactionDate
          ? new Date(interestData.lastTransactionDate)
          : undefined,
        addon: interestData.interestDetails,
        fund: interestData.totalInterest || 0,
      };
    }
  );

  for (const { vendorId, ...passbookData } of updatedPassbooks) {
    await prisma.passbook.updateMany({
      where: {
        vendor: {
          id: vendorId,
          type: "LEND",
        },
      },
      data: passbookData,
    });
  }

  return updatedPassbooks;
}
