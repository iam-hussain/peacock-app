import { Account, Passbook } from "@prisma/client";

import { getMemberLoanHistory } from "@/lib/calculators/loan-calculator";
import { calculateMonthsDifference, newZoneDate } from "@/lib/core/date";
import { MemberPassbookData } from "@/lib/validators/type";

type ToTransform = Account & { passbook: Passbook | null };

export async function transformLoanForTable(vendorInput: ToTransform) {
  const { passbook, ...member } = vendorInput;
  const {
    totalLoanTaken = 0,
    totalLoanRepay = 0,
    totalInterestPaid = 0,
  } = (passbook?.payload as unknown as MemberPassbookData) || {};

  // Calculate loan history on-the-fly from transactions
  const {
    loanHistory: calculatedLoanHistory,
    totalLoanBalance: calculatedTotalLoanBalance,
    totalInterestAmount,
    recentPassedString,
  } = await getMemberLoanHistory(member.id);

  const totalInterestBalance = totalInterestAmount - totalInterestPaid;

  return {
    id: member.id,
    username: member.username,
    link: `/dashboard/member/${member.username}`,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member.avatarUrl
      ? member.avatarUrl.startsWith("/image/")
        ? member.avatarUrl
        : `/image/${member.avatarUrl}`
      : undefined,
    joined: calculateMonthsDifference(
      newZoneDate(),
      newZoneDate(member.startedAt)
    ),
    startAt: calculatedLoanHistory.length
      ? newZoneDate(
          calculatedLoanHistory[calculatedLoanHistory.length - 1].startDate
        ).getTime()
      : 0,
    status: member.active ? "Active" : "Disabled",
    active: calculatedTotalLoanBalance > 0,
    totalLoanTaken,
    totalLoanRepay,
    totalLoanBalance: calculatedTotalLoanBalance,
    totalInterestPaid,
    totalInterestBalance,
    totalInterestAmount,
    loanHistory: calculatedLoanHistory,
    recentPassedString,
  };
}

export type TransformedLoan = Awaited<ReturnType<typeof transformLoanForTable>>;

export function membersTableTransform(
  member: ToTransform,
  memberTotalDeposit: number,
  totalReturnAmount: number,
  expectedLoanProfit: number = 0
) {
  const { passbook, ...account } = member;
  const { delayOffset = 0, joiningOffset = 0 } = passbook || {};
  const {
    periodicDepositAmount = 0,
    offsetDepositAmount = 0,
    totalDepositAmount = 0,
    withdrawalAmount = 0,
    accountBalance = 0,
    clubHeldAmount = 0,
    profitWithdrawalAmount = 0,
  } = (passbook?.payload as unknown as MemberPassbookData) || {};

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
  let totalPeriodBalanceAmount =
    totalBalanceAmount > memberTotalDeposit
      ? memberTotalDeposit - accountBalance
      : 0;

  // Calculate member's share of returns
  let memberTotalReturnAmount = totalReturnAmount - totalOffsetAmount;
  // Calculate periodic deposit balance
  let periodicDepositBalance =
    memberTotalDeposit - (periodicDepositAmount - withdrawalAmount);

  // Expected offset amount for inactive members
  let expectedOffsetAmount = 0;
  if (!member.active) {
    totalPeriodBalanceAmount =
      memberTotalDeposit + expectedLoanProfit + totalReturnAmount;
    totalBalanceAmount += memberTotalReturnAmount;
    expectedOffsetAmount = memberTotalReturnAmount + expectedLoanProfit;
    memberTotalReturnAmount = 0;
  }

  // Net value is what is in the account plus any returns
  const netValue = accountBalance + memberTotalReturnAmount;
  // Total withdrawals
  const totalWithdrawalAmount = profitWithdrawalAmount + withdrawalAmount;

  return {
    id: member.id,
    username: member.username,
    link: `/dashboard/member/${member.username}`,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member.avatarUrl
      ? member.avatarUrl.startsWith("/image/")
        ? member.avatarUrl
        : `/image/${member.avatarUrl}`
      : undefined,
    joined: calculateMonthsDifference(
      newZoneDate(),
      newZoneDate(member.startedAt)
    ),
    startAt: member.startedAt ? member.startedAt.getTime() : 0,
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
