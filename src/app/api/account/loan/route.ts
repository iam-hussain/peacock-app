export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { TransformedLoan, transformLoanForTable } from "@/transformers/account";

export async function POST() {
  const loans = await prisma.account.findMany({
    where: { isMember: true },
    include: { passbook: true },
  });

  const transformedLoans = await Promise.all(
    loans.map(transformLoanForTable)
  );

  const filteredLoans = transformedLoans
    .filter((e) => e.active || e.loanHistory.length > 0)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.active > b.active ? -1 : 1));

  return NextResponse.json({ accounts: filteredLoans });
}

export type GetLoanResponse = { accounts: TransformedLoan[] };
