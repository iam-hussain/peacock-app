import clsx from "clsx";

import { DashboardCard } from "../atoms/dashboard-card";

import { GetMemberByUsernameResponse } from "@/app/api/account/member/[username]/route";
import { moneyFormat } from "@/lib/ui/utils";

export function MemberDash({ member }: GetMemberByUsernameResponse) {
  return (
    <div
      className={clsx("grid grid-cols-1 gap-2 w-full", {
        "md:grid-cols-3": member.active,
        "md:grid-cols-2": !member.active,
      })}
    >
      {member.active ? (
        <DashboardCard
          title="Periodic Deposit Balance"
          value={moneyFormat(member.totalBalanceAmount || 0)}
          useRed={member.totalBalanceAmount > 0}
          useGreen={member.totalBalanceAmount < 0}
        />
      ) : (
        <DashboardCard
          title="Deposit to Reactivate"
          value={moneyFormat(member.totalPeriodBalanceAmount || 0)}
          useRed={member.totalPeriodBalanceAmount > 0}
          useGreen={member.totalPeriodBalanceAmount < 0}
        />
      )}
      {member.active ? (
        <>
          {" "}
          <DashboardCard
            title="Loan Amount Taken"
            value={moneyFormat(member.totalLoanBalance || 0)}
            useGreen={member.totalLoanBalance > 0}
          />
          <DashboardCard
            title="Interest Balance"
            value={moneyFormat(member.totalInterestBalance || 0)}
            useRed={member.totalInterestBalance > 0}
            useGreen={member.totalInterestBalance < 0}
          />
        </>
      ) : (
        <DashboardCard
          title="Unpaid Loan Amount"
          value={moneyFormat(member.totalLoanBalance || 0)}
          useRed={true}
        />
      )}
    </div>
  );
}
