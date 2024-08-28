import { NextResponse } from "next/server";

export async function GET() {
  // Simulate fetching statistics data
  const statistics = {
    membersPerMonth: 20,
    membersDeposit: 500000,
    membersBalance: 250000,
    netMembersAmount: 750000,
    netProfit: 20000,
    netValuePerMember: 6250,
    netLiquidity: 100000,
    clubNetValue: 850000,
  };

  return NextResponse.json(statistics);
}
