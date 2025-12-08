export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { createSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword =
      process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD;

    // Super admin login
    if (username === adminUsername) {
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
        role: "SUPER_ADMIN",
        writeAccess: true,
        readAccess: true,
      });

      return NextResponse.json(
        {
          message: "Login successful",
          user: { kind: "admin", username: "admin", role: "SUPER_ADMIN" },
        },
        { status: 200 }
      );
    }

    // Member login - try username first, then email
    let account = await prisma.account.findFirst({
      where: {
        OR: [{ username: username }, { email: username }],
        isMember: true,
        active: true,
      },
    });

    if (!account) {
      // Don't reveal if account exists - security best practice
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if account has password set
    if (!account.passwordHash) {
      return NextResponse.json(
        { error: "Account not set up for login. Please contact admin." },
        { status: 401 }
      );
    }

    // Check read access
    if (!account.readAccess) {
      return NextResponse.json(
        { error: "Account does not have read access" },
        { status: 403 }
      );
    }

    // Verify password
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

    // Create session
    await createSessionCookie({
      sub: account.id,
      role: "MEMBER",
      writeAccess: account.writeAccess,
      readAccess: account.readAccess,
    });

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          kind: "member",
          accountId: account.id,
          role: "MEMBER",
          readAccess: account.readAccess,
          writeAccess: account.writeAccess,
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
