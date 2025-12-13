export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { requireAuth } from "@/lib/core/auth";

export async function GET() {
  try {
    const user = await requireAuth();

    // Return virtual profile for super-admin
    if (user.kind === "admin") {
      return NextResponse.json(
        {
          account: {
            id: "admin",
            firstName: "Super",
            lastName: "Admin",
            phone: null,
            email: null,
            avatar: null,
            username: "admin",
            readAccess: true,
            writeAccess: true,
            active: true,
            lastLoginAt: null,
            createdAt: null,
            updatedAt: null,
          },
        },
        { status: 200 }
      );
    }

    // Allow both members and admin-members to access profile
    if (user.kind !== "member" && user.kind !== "admin-member") {
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
        readAccess: true,
        writeAccess: true,
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

    // Explicitly reject super-admin profile updates
    if (user.kind === "admin") {
      return NextResponse.json(
        { error: "Super Admin profile cannot be updated from the dashboard" },
        { status: 403 }
      );
    }

    if (user.kind !== "member") {
      return NextResponse.json(
        { error: "Only members can update profile" },
        { status: 403 }
      );
    }

    const { firstName, lastName, phone, email, avatar, username } =
      await request.json();

    // Validate username if provided
    if (username) {
      // Check username format
      if (!/^[a-z0-9_-]+$/.test(username)) {
        return NextResponse.json(
          {
            error:
              "Username can only contain lowercase letters, numbers, hyphens, and underscores",
          },
          { status: 400 }
        );
      }
      if (username.length < 3 || username.length > 50) {
        return NextResponse.json(
          { error: "Username must be between 3 and 50 characters" },
          { status: 400 }
        );
      }

      // Check username uniqueness (excluding current account)
      const existingAccount = await prisma.account.findUnique({
        where: { username },
        select: { id: true },
      });

      if (existingAccount && existingAccount.id !== user.accountId) {
        return NextResponse.json(
          {
            error:
              "Username already exists. Please choose a different username.",
          },
          { status: 400 }
        );
      }
    }

    const account = await prisma.account.update({
      where: { id: user.accountId },
      data: {
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        phone: phone ?? undefined,
        email: email ?? undefined,
        avatar: avatar ?? undefined,
        username: username ?? undefined,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        avatar: true,
        username: true,
        readAccess: true,
        writeAccess: true,
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
