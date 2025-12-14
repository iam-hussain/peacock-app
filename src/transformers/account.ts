import { Account, Passbook } from "@prisma/client";

import { getMemberLoanHistory } from "@/lib/calculators/loan-calculator";
import { calculateMonthsDifference, newZoneDate } from "@/lib/core/date";
import { MemberFinancialSnapshot } from "@/lib/validators/type";

type ToTransform = Account & { passbook: Passbook | null };

export async function transformLoanForTable(vendorInput: ToTransform) {
  const { passbook, ...member } = vendorInput;
  // Support both old and new field names for backward compatibility
  const payload =
    (passbook?.payload as unknown as MemberFinancialSnapshot & {
      totalInterestPaid?: number;
      totalLoanTaken?: number;
      totalLoanRepaid?: number;
    }) || {};
  const {
    loansPrincipalTaken = payload.totalLoanTaken ??
      payload.loansPrincipalTaken ??
      0,
    loansPrincipalRepaid = payload.totalLoanRepaid ??
      payload.loansPrincipalRepaid ??
      0,
    interestPaidTotal = payload.totalInterestPaid ??
      payload.interestPaidTotal ??
      0,
  } = payload;

  // Calculate loan history on-the-fly from transactions
  const {
    loanHistory: calculatedLoanHistory,
    totalLoanBalance: calculatedTotalLoanBalance,
    totalInterestAmount,
    recentPassedString,
  } = await getMemberLoanHistory(member.id);

  const totalInterestBalance = totalInterestAmount - interestPaidTotal;

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
    totalLoanTaken: loansPrincipalTaken,
    totalLoanRepay: loansPrincipalRepaid,
    totalLoanBalance: calculatedTotalLoanBalance,
    totalInterestPaid: interestPaidTotal,
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
  // Support both old and new field names for backward compatibility
  const payload =
    (passbook?.payload as unknown as MemberFinancialSnapshot & {
      periodicDepositAmount?: number;
      offsetDepositAmount?: number;
      totalDepositAmount?: number;
      withdrawalAmount?: number;
      accountBalance?: number;
      clubHeldAmount?: number;
      profitWithdrawalAmount?: number;
    }) || {};
  const {
    periodicDepositsTotal = payload.periodicDepositAmount ??
      payload.periodicDepositsTotal ??
      0,
    offsetDepositsTotal = payload.offsetDepositAmount ??
      payload.offsetDepositsTotal ??
      0,
    totalDeposits = payload.totalDepositAmount ?? payload.totalDeposits ?? 0,
    withdrawalsTotal = payload.withdrawalAmount ??
      payload.withdrawalsTotal ??
      0,
    memberBalance = payload.accountBalance ?? payload.memberBalance ?? 0,
    clubHeldBalance = payload.clubHeldAmount ?? payload.clubHeldBalance ?? 0,
    profitWithdrawalsTotal = payload.profitWithdrawalAmount ??
      payload.profitWithdrawalsTotal ??
      0,
  } = payload;

  // Calculate total offset and balances
  const totalOffsetAmount = delayOffset + joiningOffset;
  const totalDepositMinusWithdrawals = totalDeposits - withdrawalsTotal;
  const periodicDepositMinusWithdrawals =
    periodicDepositsTotal - withdrawalsTotal;
  const totalOffsetBalanceAmount = totalOffsetAmount - offsetDepositsTotal;

  // Total balance is what the member should have minus what is in their account
  let totalBalanceAmount =
    memberTotalDeposit + totalOffsetAmount - memberBalance;
  // If total balance is more than memberTotalDeposit, use only the period balance
  let totalPeriodBalanceAmount =
    totalBalanceAmount > memberTotalDeposit
      ? memberTotalDeposit - memberBalance
      : 0;

  // Calculate member's share of returns
  let memberTotalReturnAmount = totalReturnAmount - totalOffsetAmount;
  // Calculate periodic deposit balance
  let periodicDepositBalance =
    memberTotalDeposit - (periodicDepositsTotal - withdrawalsTotal);

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
  const netValue = memberBalance + memberTotalReturnAmount;
  // Total withdrawals
  const totalWithdrawalAmount = profitWithdrawalsTotal + withdrawalsTotal;

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
    offsetDepositAmount: offsetDepositsTotal,
    totalOffsetBalanceAmount,
    totalPeriodBalanceAmount,
    totalBalanceAmount,
    totalReturnAmount: memberTotalReturnAmount,
    expectedReturnAmount: expectedLoanProfit,
    clubHeldAmount: clubHeldBalance,
    delayOffset,
    joiningOffset,
    netValue,
    account: { ...account, delayOffset, joiningOffset },
    periodicDepositBalance,
    withdrawalAmount: withdrawalsTotal,
    profitWithdrawalAmount: profitWithdrawalsTotal,
    accountBalance: memberBalance,
    memberTotalDeposit,
    totalWithdrawalAmount,
    expectedOffsetAmount,
  };
}

export type TransformedMember = ReturnType<typeof membersTableTransform>;
