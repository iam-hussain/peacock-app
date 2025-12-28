export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/db";
import { TransformedLoan, transformLoanForTable } from "@/transformers/account";

/**
 * @swagger
 * /api/account/loan:
 *   post:
 *     summary: Get loan accounts
 *     description: Retrieves all member accounts with loan information, including active loans and loan history. Results are sorted by name and active status.
 *     tags: [Account]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of loan accounts
 *         headers:
 *           ETag:
 *             description: ETag for cache validation
 *             schema:
 *               type: string
 *           Cache-Control:
 *             description: Cache control directives
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Account ID
 *                       name:
 *                         type: string
 *                         description: Member name
 *                       active:
 *                         type: boolean
 *                         description: Whether loan is currently active
 *                       loanHistory:
 *                         type: array
 *                         items:
 *                           type: object
 *                         description: Historical loan records
 *       304:
 *         description: Not Modified - client has cached version
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error("Error fetching loan accounts:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch loan accounts" },
      { status: 500 }
    );
  }
}

export type GetLoanResponse = { accounts: TransformedLoan[] };
