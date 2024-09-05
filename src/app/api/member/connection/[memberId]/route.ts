import { NextResponse } from "next/server";

import prisma from "@/db";

// GET Request to fetch the member's vendor connections
export async function GET(
  request: Request,
  { params }: { params: { memberId: string } },
) {
  const { memberId } = params;

  const connections = await prisma.vendorProfitShare.findMany({
    where: { memberId },
    select: {
      id: true,
      active: true,
      vendor: {
        select: {
          name: true,
        },
      },
    },
  });

  return NextResponse.json({ connections });
}

// PATCH Request to update the member's vendor connections
export async function POST(
  request: Request,
  { params }: { params: { memberId: string } },
) {
  const { memberId } = params;
  const data = await request.json();

  const updates = await Promise.all(
    data.map((update: { id: string; active: boolean }) =>
      prisma.vendorProfitShare.update({
        where: { id: update.id, memberId },
        data: { active: update.active },
      }),
    ),
  );

  return NextResponse.json({ updates });
}
