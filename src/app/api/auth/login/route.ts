export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

import prisma from "@/db";
import { env, getAdminPassword } from "@/lib/config/env";
import { createSessionCookie, verifyPassword } from "@/lib/core/auth";
import { loginSchema } from "@/lib/validators/api-schemas";

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with username/email and password. Creates a session cookie upon successful login.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username or email address
 *                 example: john.doe
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie containing authentication token
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   type: object
 *                   properties:
 *                     kind:
 *                       type: string
 *                       enum: [admin, admin-member, member]
 *                       description: User type
 *                     username:
 *                       type: string
 *                       description: Username (for admin)
 *                     accountId:
 *                       type: string
 *                       description: Account ID (for members)
 *                     role:
 *                       type: string
 *                       enum: [SUPER_ADMIN, ADMIN, MEMBER]
 *                       description: User role
 *                     accessLevel:
 *                       type: string
 *                       enum: [ADMIN, MEMBER]
 *                       description: Access level
 *                     canLogin:
 *                       type: boolean
 *                       description: Whether login is enabled
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials or account not set up
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid username or password
 *       403:
 *         description: Login disabled for account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Login is disabled for this account. Please contact the club admin.
 *       500:
 *         description: Server error or admin not configured
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { username, password } = validationResult.data;

    const adminUsername = env.ADMIN_USERNAME;
    const adminPassword = getAdminPassword();

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
        accessLevel: "ADMIN",
        canLogin: true,
      });

      return NextResponse.json(
        {
          message: "Login successful",
          user: { kind: "admin", username: "admin", role: "SUPER_ADMIN" },
        },
        { status: 200 }
      );
    }

    // Member/Admin login - try username or email
    const account = await prisma.account.findFirst({
      where: {
        OR: [{ username: username }, { email: username }],
        type: "MEMBER",
        active: true,
      },
      select: {
        id: true,
        role: true,
        accessLevel: true,
        passwordHash: true,
        canLogin: true,
      },
    });

    if (!account) {
      // Don't reveal if account exists - security best practice
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if login is enabled
    if (!account.canLogin) {
      return NextResponse.json(
        {
          error:
            "Login is disabled for this account. Please contact the club admin.",
        },
        { status: 403 }
      );
    }

    // Check if account has password set
    if (!account.passwordHash) {
      return NextResponse.json(
        { error: "Account not set up for login. Please contact admin." },
        { status: 401 }
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
      role: account.role,
      accessLevel: account.accessLevel,
      canLogin: account.canLogin,
    });

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          kind:
            account.role === "ADMIN"
              ? ("admin-member" as const)
              : ("member" as const),
          accountId: account.id,
          role: account.role,
          accessLevel: account.accessLevel,
          canLogin: account.canLogin,
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
