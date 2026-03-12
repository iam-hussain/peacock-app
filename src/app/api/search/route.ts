import { NextResponse } from "next/server";

import prisma from "@/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type SearchResult = {
  members: Array<unknown>;
  vendors: Array<unknown>;
  loans: Array<unknown>;
  transactions: Array<unknown>;
};

/**
 * @swagger
 * /api/search:
 *   post:
 *     summary: Search across members, vendors, loans, and transactions
 *     description: Performs a search query across multiple entities in the system
 *     tags: [Search]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               searchQuery:
 *                 type: string
 *                 description: Search query string
 *                 example: "john"
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                   description: The search query that was processed
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Matching members
 *                 vendors:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Matching vendors
 *                 loans:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Matching loans (members with loan transactions)
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Matching transactions
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to process search
 */
export async function POST(request: Request) {
  try {
    const { requireAuth } = await import("@/lib/core/auth");
    await requireAuth();

    const { searchQuery } = await request
      .json()
      .catch(() => ({ searchQuery: "" }));
    const query = typeof searchQuery === "string" ? searchQuery.trim() : "";

    // Return empty results for blank queries
    if (!query) {
      const payload: SearchResult = {
        members: [],
        vendors: [],
        loans: [],
        transactions: [],
      };
      return NextResponse.json({ query, ...payload }, { status: 200 });
    }

    const nameFilter = {
      OR: [
        { firstName: { contains: query, mode: "insensitive" as const } },
        { lastName: { contains: query, mode: "insensitive" as const } },
        { username: { contains: query, mode: "insensitive" as const } },
      ],
    };

    // Run all searches in parallel
    const [members, vendors, loanMembers, transactions] = await Promise.all([
      // Search members by firstName, lastName, username
      prisma.account.findMany({
        where: {
          type: "MEMBER",
          ...nameFilter,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          avatarUrl: true,
          status: true,
          active: true,
        },
        take: 10,
      }),

      // Search vendors by firstName, lastName
      prisma.account.findMany({
        where: {
          type: "VENDOR",
          OR: [
            { firstName: { contains: query, mode: "insensitive" as const } },
            { lastName: { contains: query, mode: "insensitive" as const } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatarUrl: true,
          status: true,
          active: true,
        },
        take: 10,
      }),

      // Search loan members: members whose name matches and who have loan transactions
      prisma.account.findMany({
        where: {
          type: "MEMBER",
          ...nameFilter,
          outgoingTransactions: {
            some: {
              type: {
                in: ["LOAN_TAKEN", "LOAN_REPAY", "LOAN_INTEREST"],
              },
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatarUrl: true,
          status: true,
          active: true,
        },
        take: 10,
      }),

      // Search transactions by description or referenceId
      prisma.transaction.findMany({
        where: {
          OR: [
            {
              description: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
            {
              referenceId: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          ],
        },
        select: {
          id: true,
          description: true,
          referenceId: true,
          amount: true,
          type: true,
          method: true,
          occurredAt: true,
          from: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          to: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
        orderBy: { occurredAt: "desc" },
        take: 10,
      }),
    ]);

    const payload: SearchResult = {
      members,
      vendors,
      loans: loanMembers,
      transactions,
    };

    return NextResponse.json({ query, ...payload }, { status: 200 });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Search route error:", error);
    return NextResponse.json(
      { error: "Failed to process search" },
      { status: 500 }
    );
  }
}
