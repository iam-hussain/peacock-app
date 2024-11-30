import { Account, Passbook } from "@prisma/client";

import { calculateMonthsDifference } from "@/lib/date";
import { calculateInterestByAmount } from "@/lib/helper";
import { LoanHistoryEntry, MemberPassbookData } from "@/lib/type";

type ToTransform = Account & {
  passbook: Passbook;
};

export function transformLoanForTable(vendorInput: ToTransform) {
  const { passbook, ...member } = vendorInput;
  const {
    totalLoanTaken = 0,
    totalLoanRepay = 0,
    totalLoanBalance = 0,
    totalInterestPaid = 0,
  } = passbook.payload as unknown as MemberPassbookData;
  const loans = (passbook.loanHistory || []) as unknown as LoanHistoryEntry[];

  let totalInterestAmount = 0;
  let recentPassedString: any = "";

  const loanHistory = loans.map((loan) => {
    const {
      interestAmount,
      daysInMonth,
      daysPassed,
      monthsPassed,
      monthsPassedString,
      interestForDays,
      interestPerDay,
    } = calculateInterestByAmount(loan.amount, loan.startDate, loan?.endDate);

    totalInterestAmount += interestAmount;
    recentPassedString = monthsPassedString;
    return {
      ...loan,
      startDate: new Date(loan.startDate).getTime(),
      endDate: new Date(loan.endDate || new Date()).getTime(),
      totalInterestAmount,
      interestAmount,
      daysInMonth,
      daysPassed,
      monthsPassed,
      monthsPassedString,
      interestForDays,
      interestPerDay,
    };
  });

  const totalInterestBalance = totalInterestAmount - totalInterestPaid;

  return {
    id: member.id,
    slug: member.slug,
    link: `/dashboard/member/${member.slug}`,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    joined: calculateMonthsDifference(new Date(), new Date(member.startAt)),
    startAt: loans.length
      ? new Date(loans[loans.length - 1].startDate).getTime()
      : 0,
    status: member.active ? "Active" : "Disabled",
    active: totalLoanBalance > 0,
    totalLoanTaken,
    totalLoanRepay,
    totalLoanBalance,
    totalInterestPaid,
    totalInterestBalance,
    totalInterestAmount,
    loanHistory,
    recentPassedString,
  };
}

export type TransformedLoan = ReturnType<typeof transformLoanForTable>;

export function membersTableTransform(
  member: ToTransform,
  memberTotalDeposit: number,
  totalReturnAmount: number
) {
  const {
    passbook: { delayOffset, joiningOffset },
    ...account
  } = member;
  const {
    periodicDepositAmount = 0,
    offsetDepositAmount = 0,
    totalDepositAmount = 0,
    withdrawalAmount = 0,
    accountBalance = 0,
    clubHeldAmount = 0,
    profitWithdrawalAmount,
  } = member.passbook.payload as unknown as MemberPassbookData;

  const totalOffsetAmount = delayOffset + joiningOffset;
  let totalBalanceAmount =
    memberTotalDeposit + totalOffsetAmount - accountBalance;
  const totalPeriodBalanceAmount =
    totalBalanceAmount > memberTotalDeposit
      ? memberTotalDeposit - accountBalance
      : 0;

  if (!member.active) {
    totalBalanceAmount = totalBalanceAmount + totalReturnAmount;
    totalReturnAmount = 0;
  }

  const memberTotalReturnAmount = totalReturnAmount - totalOffsetAmount;
  const periodicDepositBalance =
    memberTotalDeposit - (periodicDepositAmount - withdrawalAmount);

  const totalOffsetBalanceAmount = totalOffsetAmount - offsetDepositAmount;

  return {
    id: member.id,
    slug: member.slug,
    link: `/dashboard/member/${member.slug}`,
    name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
    avatar: member.avatar ? `/image/${member.avatar}` : undefined,
    joined: calculateMonthsDifference(new Date(), new Date(member.startAt)),
    startAt: member.startAt.getTime(),
    status: member.active ? "Active" : "Disabled",
    active: member.active,
    totalDepositAmount: totalDepositAmount - withdrawalAmount,
    totalOffsetAmount,
    periodicDepositAmount: periodicDepositAmount - withdrawalAmount,
    offsetDepositAmount,
    totalOffsetBalanceAmount,
    totalPeriodBalanceAmount,
    totalBalanceAmount,
    totalReturnAmount: memberTotalReturnAmount,
    clubHeldAmount,
    delayOffset,
    joiningOffset,
    netValue: accountBalance + memberTotalReturnAmount,
    account: { ...account, delayOffset, joiningOffset },
    periodicDepositBalance,
    withdrawalAmount,
    profitWithdrawalAmount,
    accountBalance,
    memberTotalDeposit,
    totalWithdrawalAmount: profitWithdrawalAmount + withdrawalAmount,
  };
}

export type TransformedMember = ReturnType<typeof membersTableTransform>;
