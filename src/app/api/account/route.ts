import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { getDefaultPassbookData } from "@/lib/helper";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      id,
      firstName,
      lastName,
      phone,
      email,
      avatar,
      active,
      startAt,
      endAt,
      isMember,
    } = data;

    // Validate required fields
    if (!firstName && !id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const commonData: Parameters<typeof prisma.account.update>[0]["data"] = {
      firstName: firstName || undefined,
      lastName: lastName ?? undefined,
      phone: phone ?? undefined,
      email: email ?? undefined,
      avatar: avatar ?? undefined,
      startAt: new Date(startAt || new Date()),
      endAt: endAt ? new Date(endAt) : undefined,
      active: active ?? true,
      isMember: isMember || false,
    };

    if (id) {
      // Update existing member
      const updated = await prisma.account.update({
        where: { id },
        data: commonData,
      });
      return NextResponse.json({ account: updated }, { status: 200 });
    }

    // Create a new member
    const created = await prisma.account.create({
      data: {
        ...(commonData as any),
        passbook: {
          create: {
            type: isMember ? "MEMBER" : "VENDOR",
            data: getDefaultPassbookData("MEMBER"),
          },
        },
      },
    });

    if (isMember) {
      const vendors = await prisma.account.findMany({
        where: { isMember: false },
        select: { active: true, id: true },
      });
      await prisma.profitShare.createMany({
        data: vendors.map((e) => ({
          vendorId: e.id,
          active: e.active,
          memberId: created.id,
        })),
      });
    } else {
      const members = await prisma.account.findMany({
        where: { isMember: true },
        select: { active: true, id: true },
      });
      await prisma.profitShare.createMany({
        data: members.map((e) => ({
          vendorId: created.id,
          active: e.active,
          memberId: e.id,
        })),
      });
    }

    revalidatePath("/members");
    return NextResponse.json({ account: created }, { status: 200 });
  } catch (error) {
    console.error("Error creating/updating member:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
