import { Account, Passbook } from "@prisma/client";

import { calculateMonthsDifference, newZoneDate } from "@/lib/date";
import { calculateInterestByAmount } from "@/lib/helper";
import { LoanHistoryEntry, MemberPassbookData } from "@/lib/type";

type ToTransform = Account & { passbook: Passbook };

export function transformLoanForTable(vendorInput: ToTransform) {
  const { passbook, ...member } = vendorInput;
  const {
    totalLoanTaken = 0,
    totalLoanRepay = 0,
    totalLoanBalance = 0,
    totalInterestPaid = 0,
  } = passbook.payload as unknown as MemberPassbookData;
  const loans = (passbook.loanHistory || []) as unknown as LoanHistoryEntry[];

  // Calculate interest and build loan history in a single pass
  const loanHistoryResult = loans.reduce(
    (acc, loan) => {
      const interestCalc = calculateInterestByAmount(
        loan.amount,
        loan.startDate,
        loan?.endDate
      );
      acc.totalInterestAmount += interestCalc.interestAmount;
      // Remove startDate and endDate from loan before spreading
      const { startDate: _startDate, endDate: _endDate } = loan;
      acc.loanHistory.push({
        ...interestCalc,
        amount: loan.amount,
        // add other properties from LoanHistoryEntry as needed
        startDate: newZoneDate(loan.startDate).getTime(),
        endDate: newZoneDate(loan.endDate || undefined).getTime(),
        totalInterestAmount: acc.totalInterestAmount,
      });
      // Store the most recent monthsPassedString
      if (interestCalc.monthsPassedString) {
        acc.recentPassedString = interestCalc.monthsPassedString;
      }
      return acc;
    },
    { totalInterestAmount: 0, loanHistory: [] as any[], recentPassedString: "" }
  );

  const totalInterestBalance =
    loanHistoryResult.totalInterestAmount - totalInterestPaid;

  return {
    id: member.id,
    slug: member.slug,
    link: `/dashboard/member/${member.slug}`,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    joined: calculateMonthsDifference(
      newZoneDate(),
      newZoneDate(member.startAt)
    ),
    startAt: loans.length
      ? newZoneDate(loans[loans.length - 1].startDate).getTime()
      : 0,
    status: member.active ? "Active" : "Disabled",
    active: totalLoanBalance > 0,
    totalLoanTaken,
    totalLoanRepay,
    totalLoanBalance,
    totalInterestPaid,
    totalInterestBalance,
    totalInterestAmount: loanHistoryResult.totalInterestAmount,
    loanHistory: loanHistoryResult.loanHistory,
    recentPassedString: loanHistoryResult.recentPassedString,
  };
}

export type TransformedLoan = ReturnType<typeof transformLoanForTable>;

export function membersTableTransform(
  member: ToTransform,
  memberTotalDeposit: number,
  totalReturnAmount: number,
  expectedLoanProfit: number = 0
) {
  const {
    passbook: { delayOffset = 0, joiningOffset = 0 },
    ...account
  } = member;
  const {
    periodicDepositAmount = 0,
    offsetDepositAmount = 0,
    totalDepositAmount = 0,
    withdrawalAmount = 0,
    accountBalance = 0,
    clubHeldAmount = 0,
    profitWithdrawalAmount = 0,
  } = member.passbook.payload as unknown as MemberPassbookData;

  // Calculate total offset and balances
  const totalOffsetAmount = delayOffset + joiningOffset;
  const totalDepositMinusWithdrawals = totalDepositAmount - withdrawalAmount;
  const periodicDepositMinusWithdrawals =
    periodicDepositAmount - withdrawalAmount;
  const totalOffsetBalanceAmount = totalOffsetAmount - offsetDepositAmount;

  // Total balance is what the member should have minus what is in their account
  let totalBalanceAmount =
    memberTotalDeposit + totalOffsetAmount - accountBalance;
  // If total balance is more than memberTotalDeposit, use only the period balance
  const totalPeriodBalanceAmount =
    totalBalanceAmount > memberTotalDeposit
      ? memberTotalDeposit - accountBalance
      : 0;

  // Calculate member's share of returns
  let memberTotalReturnAmount = totalReturnAmount - totalOffsetAmount;
  // Calculate periodic deposit balance
  const periodicDepositBalance =
    memberTotalDeposit - (periodicDepositAmount - withdrawalAmount);

  // Expected offset amount for inactive members
  let expectedOffsetAmount = 0;
  if (!member.active) {
    totalBalanceAmount += memberTotalReturnAmount;
    expectedOffsetAmount = memberTotalReturnAmount;
    memberTotalReturnAmount = 0;
  }

  // Net value is what is in the account plus any returns
  const netValue = accountBalance + memberTotalReturnAmount;
  // Total withdrawals
  const totalWithdrawalAmount = profitWithdrawalAmount + withdrawalAmount;

  return {
    id: member.id,
    slug: member.slug,
    link: `/dashboard/member/${member.slug}`,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    joined: calculateMonthsDifference(
      newZoneDate(),
      newZoneDate(member.startAt)
    ),
    startAt: member.startAt.getTime(),
    status: member.active ? "Active" : "Disabled",
    active: member.active,
    totalDepositAmount: totalDepositMinusWithdrawals,
    totalOffsetAmount,
    periodicDepositAmount: periodicDepositMinusWithdrawals,
    offsetDepositAmount,
    totalOffsetBalanceAmount,
    totalPeriodBalanceAmount,
    totalBalanceAmount,
    totalReturnAmount: memberTotalReturnAmount,
    expectedReturnAmount: expectedLoanProfit,
    clubHeldAmount,
    delayOffset,
    joiningOffset,
    netValue,
    account: { ...account, delayOffset, joiningOffset },
    periodicDepositBalance,
    withdrawalAmount,
    profitWithdrawalAmount,
    accountBalance,
    memberTotalDeposit,
    totalWithdrawalAmount,
    expectedOffsetAmount,
  };
}

export type TransformedMember = ReturnType<typeof membersTableTransform>;
