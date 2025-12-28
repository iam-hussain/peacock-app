import { NextResponse } from "next/server";

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
 *                   description: Matching loans
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: Matching transactions
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
    const { searchQuery } = await request
      .json()
      .catch(() => ({ searchQuery: "" }));
    const query = typeof searchQuery === "string" ? searchQuery.trim() : "";

    const payload: SearchResult = {
      members: [],
      vendors: [],
      loans: [],
      transactions: [],
    };

    return NextResponse.json(
      {
        query,
        ...payload,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Search route error:", error);
    return NextResponse.json(
      { error: "Failed to process search" },
      { status: 500 }
    );
  }
}
