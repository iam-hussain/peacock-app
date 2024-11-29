import { NextResponse } from "next/server";

import prisma from "@/db";
import { TransformedLoan, transformLoanForTable } from "@/transformers/account";

export async function GET() {
  const loans = await prisma.account.findMany({
    where: {
      isMember: true,
    },
    include: {
      passbook: true,
    },
  });

  const transformedLoans = loans
    .filter(
      (e) =>
        e.active ||
        (Array.isArray(e.passbook.loanHistory) &&
          e.passbook.loanHistory.length > 0)
    )
    .map(transformLoanForTable)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.active > b.active ? -1 : 1));

  return NextResponse.json({
    accounts: transformedLoans,
  });
}

export type GetLoanResponse = {
  accounts: TransformedLoan[];
};
