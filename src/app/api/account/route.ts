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
    await prisma.account.create({
      data: {
        ...(commonData as any),
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

    revalidatePath("/member");
    revalidatePath("/vendor");
    revalidatePath("/loan");
    return NextResponse.json({ account: commonData }, { status: 200 });
  } catch (error) {
    console.error("Error creating/updating member:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
