import { NextResponse } from "next/server";

import prisma from "@/db";

// GET: Fetch all member connections for a vendor
export async function GET(
  request: Request,
  { params }: { params: { vendorId: string } }
) {
  const { vendorId } = params;

  const connections = await prisma.vendorProfitShare.findMany({
    where: { vendorId },
    select: {
      id: true,
      active: true,
      member: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return NextResponse.json({ connections });
}

// PATCH: Update member connections for a vendor
export async function POST(
  request: Request,
  { params }: { params: { vendorId: string } }
) {
  const { vendorId } = params;
  const data = await request.json();

  const updates = await Promise.all(
    data.map((update: { id: string; active: boolean }) =>
      prisma.vendorProfitShare.update({
        where: { id: update.id, vendorId },
        data: { active: update.active },
      })
    )
  );

  return NextResponse.json({ updates });
}
