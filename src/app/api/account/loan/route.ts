export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/db";
import { TransformedLoan, transformLoanForTable } from "@/transformers/account";

export async function POST(request: NextRequest) {
  const loans = await prisma.account.findMany({
    where: { type: "MEMBER" },
    include: { passbook: true },
  });

  const transformedLoans = await Promise.all(
    loans.map((loan) =>
      loan.passbook ? transformLoanForTable(loan as any) : null
    )
  );

  const filteredLoans = transformedLoans
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .filter((e) => e.active || e.loanHistory.length > 0)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .sort((a, b) => (a.active > b.active ? -1 : 1));

  const response = { accounts: filteredLoans };

  // Generate ETag from response content hash for cache validation
  const responseString = JSON.stringify(response);
  const etag = `"${Buffer.from(responseString).toString("base64").slice(0, 16)}"`;

  // Check if client has cached version
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 }); // Not Modified
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "private, no-cache, must-revalidate",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export type GetLoanResponse = { accounts: TransformedLoan[] };
