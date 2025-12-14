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
