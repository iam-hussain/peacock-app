import prisma from "@/db";
import { NextResponse } from "next/server";

// GET Request to fetch the member's vendor connections
export async function GET(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  const { memberId } = params;

  const connections = await prisma.vendorProfitShare.findMany({
    where: { memberId },
    include: {
      vendor: true,
    },
  });

  return NextResponse.json({ connections });
}

// PATCH Request to update the member's vendor connections
export async function PATCH(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  const { memberId } = params;
  const data = await request.json();

  const updates = await Promise.all(
    data.map((update: { id: string; active: boolean }) =>
      prisma.vendorProfitShare.update({
        where: { id: update.id },
        data: { active: update.active },
      })
    )
  );

  return NextResponse.json({ updates });
}
