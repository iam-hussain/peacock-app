import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { newZoneDate } from "@/lib/date";
import { getDefaultPassbookData } from "@/lib/helper";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      id,
      firstName,
      lastName,
      slug,
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
      slug: slug ?? undefined,
      phone: phone ?? undefined,
      email: email ?? undefined,
      avatar: avatar ?? undefined,
      startAt: newZoneDate(startAt || undefined),
      endAt: endAt ? newZoneDate(endAt) : undefined,
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
    await prisma.account.create({
      data: {
        ...(commonData as any),
        slug: nanoid(8),
        passbook: {
          create: {
            type: isMember ? "MEMBER" : "VENDOR",
            payload: getDefaultPassbookData(isMember ? "MEMBER" : "VENDOR"),
            loanHistory: [],
            joiningOffset: 0,
            delayOffset: 0,
          },
        },
      },
    });

    revalidatePath("*");
    return NextResponse.json({ account: commonData }, { status: 200 });
  } catch (error) {
    console.error("Error creating/updating member:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
