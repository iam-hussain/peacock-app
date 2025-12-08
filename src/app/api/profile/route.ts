export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();

    if (user.kind !== "member") {
      return NextResponse.json(
        { error: "Only members can access profile" },
        { status: 403 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: user.accountId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        avatar: true,
        username: true,
        canRead: true,
        canWrite: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ account }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();

    if (user.kind !== "member") {
      return NextResponse.json(
        { error: "Only members can update profile" },
        { status: 403 }
      );
    }

    const { firstName, lastName, phone, email, avatar } = await request.json();

    const account = await prisma.account.update({
      where: { id: user.accountId },
      data: {
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        phone: phone ?? undefined,
        email: email ?? undefined,
        avatar: avatar ?? undefined,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        avatar: true,
        username: true,
        canRead: true,
        canWrite: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ account }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
