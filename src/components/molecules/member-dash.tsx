import { DashboardCard } from "../atoms/dashboard-card";

import { GetMemberBySlugResponse } from "@/app/api/account/member/[slug]/route";
import { moneyFormat } from "@/lib/utils";

export function MemberDash({ member }: GetMemberBySlugResponse) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
      <DashboardCard
        title="Periodic Deposit Balance"
        value={moneyFormat(member.totalBalanceAmount || 0)}
        useRed={member.totalBalanceAmount > 0}
        useGreen={member.totalBalanceAmount < 0}
      />
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
    </div>
  );
}
