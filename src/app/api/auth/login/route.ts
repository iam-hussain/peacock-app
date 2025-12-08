export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { createSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Super admin login
    if (username === "admin") {
      const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
      if (!adminPassword) {
        return NextResponse.json(
          { error: "Admin authentication not configured" },
          { status: 500 }
        );
      }

      if (password !== adminPassword) {
        return NextResponse.json(
          { error: "Invalid username or password" },
          { status: 401 }
        );
      }

      await createSessionCookie({
        sub: "admin",
        role: "ADMIN",
        canWrite: true,
        canRead: true,
      });

      return NextResponse.json(
        { message: "Login successful", user: { kind: "admin" } },
        { status: 200 }
      );
    }

    // Member login - try username first, then fallback to slug/email/phone
    let account = await prisma.account.findFirst({
      where: {
        username: username,
        isMember: true,
        active: true,
      },
    });

    // If not found by username, try slug/email/phone
    if (!account) {
      account = await prisma.account.findFirst({
        where: {
          OR: [{ slug: username }, { email: username }, { phone: username }],
          isMember: true,
          active: true,
        },
      });
    }

    if (!account) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    if (!account.passwordHash) {
      return NextResponse.json(
        { error: "Account not set up for login. Please contact admin." },
        { status: 401 }
      );
    }

    if (!account.canRead) {
      return NextResponse.json(
        { error: "Account does not have read access" },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(
      password,
      account.passwordHash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    await createSessionCookie({
      sub: account.id,
      role: "MEMBER",
      canWrite: account.canWrite,
      canRead: account.canRead,
    });

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          kind: "member",
          accountId: account.id,
          canRead: account.canRead,
          canWrite: account.canWrite,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
