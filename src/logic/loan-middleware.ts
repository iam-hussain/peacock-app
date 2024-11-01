import prisma from "@/db";
import { calculateTimePassed } from "@/lib/date";

type PassbookToUpdate = Map<
  string,
  Parameters<typeof prisma.passbook.update>[0]
>;

function fetchLoanTransaction(vendorId?: string | null) {
  return prisma.transaction.findMany({
    where: {
      vendor: {
        type: "LEND",
        ...(vendorId ? { id: vendorId } : {}),
      },
    },
    include: {
      vendor: {
        select: {
          passbookId: true,
        },
      },
    },
    orderBy: {
      transactionAt: "asc",
    },
  });
}

export function calculateInterest(
  transactions: Awaited<ReturnType<typeof fetchLoanTransaction>>
) {
  const ONE_MONTH_RATE = 0.01;
  let invested = 0;
  let returned = 0;
  let account = 0;
  let lastTransactionDate: any;
  let paid = 0;
  let interest = 0;
  let balance = 0;
  let detailsList = [];

  transactions.forEach((transaction) => {
    const { transactionType, amount, transactionAt } = transaction;
    const date = new Date(transactionAt);

    if (transactionType === "INVEST") {
      invested += amount;
      account += amount;

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
      const interestForMonths = account * ONE_MONTH_RATE * monthsPassed;
      const interestForDays = account * ONE_MONTH_RATE * (daysPassed / 30);
      const interestAmount = interestForMonths + interestForDays;

      interest += interestAmount;

      detailsList.push({
        active: false,
        amount: account,
        startDate: lastTransactionDate,
        endDate: date.toISOString().split("T")[0],
        interestAmount,
        monthsPassed,
        daysPassed,
      });

      lastTransactionDate = date.toISOString().split("T")[0];

      account -= amount;
      returned += amount;

      if (returned === invested) {
        lastTransactionDate = null;
      }
    }

    if (transactionType === "PROFIT") {
      paid += amount;
    }
  });

  if (account > 0 && lastTransactionDate) {
    const { monthsPassed, daysPassed } = calculateTimePassed(
      new Date(lastTransactionDate),
      new Date()
    );
    // Interest for months and days
    const interestForMonths = account * ONE_MONTH_RATE * monthsPassed;
    const interestAmount = interestForMonths; //  + interestForDays;

    detailsList.push({
      active: true,
      amount: account,
      startDate: lastTransactionDate,
      interestAmount: interestAmount,
      monthsPassed,
      daysPassed,
    });
  }

  balance = interest - paid;

  return {
    invested,
    returned,
    paid,
    account: Math.abs(account),
    balance,
    lastTransactionDate,
    interest,
    detailsList,
  };
}

function handleCalculateInterestMap(
  transactions: Awaited<ReturnType<typeof fetchLoanTransaction>>,
  passbookId: string
) {
  const interestData = calculateInterest(transactions);

  return {
    where: { id: passbookId },
    data: {
      in: interestData.invested,
      out: interestData.returned,
      returns: interestData.paid,
      offset: interestData.account,
      balance: interestData.balance,
      date: interestData.lastTransactionDate
        ? new Date(interestData.lastTransactionDate)
        : undefined,
      addon: interestData.detailsList,
      fund: interestData.interest || 0,
    },
  };
}

export async function updateAllLoanMiddleware(
  passbookToUpdate: PassbookToUpdate
) {
  const transaction = await fetchLoanTransaction();
  const transactionsByVendor: {
    [key in string]: Awaited<ReturnType<typeof fetchLoanTransaction>>;
  } = {};

  transaction.forEach((e) => {
    if (!transactionsByVendor[e.vendor.passbookId]) {
      transactionsByVendor[e.vendor.passbookId] = [];
    }
    transactionsByVendor[e.vendor.passbookId].push(e);
  });

  Object.entries(transactionsByVendor).forEach(([passbookId, transactions]) =>
    passbookToUpdate.set(
      passbookId,
      handleCalculateInterestMap(transactions, passbookId)
    )
  );

  return passbookToUpdate;
}

export async function updateLoanMiddleware(
  passbookToUpdate: PassbookToUpdate,
  vendorId: string
) {
  const transaction = await fetchLoanTransaction(vendorId);

  if (transaction[0].vendor.passbookId) {
    passbookToUpdate.set(
      transaction[0].vendor.passbookId,
      handleCalculateInterestMap(transaction, transaction[0].vendor.passbookId)
    );
  }

  return passbookToUpdate;
}
