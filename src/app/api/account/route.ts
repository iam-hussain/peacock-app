export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { nanoid } from "nanoid";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { newZoneDate } from "@/lib/date";
import { getDefaultPassbookData } from "@/lib/helper";

export async function POST(request: Request) {
  try {
    const { requireSuperAdmin, hashPassword } = await import("@/lib/auth");
    await requireSuperAdmin();

    const data = await request.json();
    const {
      id,
      firstName,
      lastName,
      slug,
      username,
      password,
      phone,
      email,
      avatar,
      active,
      startAt,
      endAt,
      isMember,
      readAccess,
      writeAccess,
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
      username: username ?? undefined,
      phone: phone ?? undefined,
      email: email ?? undefined,
      avatar: avatar ?? undefined,
      startAt: newZoneDate(startAt || undefined),
      endAt: endAt ? newZoneDate(endAt) : undefined,
      active: active ?? true,
      isMember: isMember ?? true,
      readAccess: readAccess ?? true,
      writeAccess: writeAccess ?? false,
    };

    if (id) {
      // Update existing member
      const updateData: any = { ...commonData };

      // Only update password if provided
      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }

      const updated = await prisma.account.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json({ account: updated }, { status: 200 });
    }

    // Create a new member
    const createData: any = {
      ...commonData,
      slug: slug || nanoid(8),
      passbook: {
        create: {
          type: isMember ? "MEMBER" : "VENDOR",
          payload: getDefaultPassbookData(isMember ? "MEMBER" : "VENDOR"),
          loanHistory: [],
          joiningOffset: 0,
          delayOffset: 0,
        },
      },
    };

    // Hash password if provided
    if (password) {
      createData.passwordHash = await hashPassword(password);
    }

    await prisma.account.create({
      data: createData,
    });

    revalidatePath("*");
    revalidateTag("api");
    return NextResponse.json({ account: commonData }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating/updating member:", error);
    if (
      error.message === "Unauthorized" ||
      error.message.includes("Forbidden")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
