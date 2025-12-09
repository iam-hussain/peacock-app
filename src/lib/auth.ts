import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    process.env.AUTH_SECRET ||
    "default-secret-change-in-production"
);

const COOKIE_NAME = "pc_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type AuthUser = {
  id: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
  readAccess: boolean;
  writeAccess: boolean;
  canLogin: boolean;
};

export type CurrentUser =
  | {
      kind: "admin";
      username: "admin";
      role: "SUPER_ADMIN";
      id: "admin";
      canLogin: true;
      readAccess: true;
      writeAccess: true;
    }
  | {
      kind: "admin-member";
      accountId: string;
      id: string;
      role: "ADMIN";
      canLogin: boolean;
      readAccess: boolean;
      writeAccess: boolean;
    }
  | {
      kind: "member";
      accountId: string;
      id: string;
      role: "MEMBER";
      readAccess: boolean;
      writeAccess: boolean;
      canLogin: boolean;
    };

type JWTPayload = {
  sub: string; // "admin" or accountId
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
  readAccess: boolean;
  writeAccess: boolean;
  canLogin: boolean;
  exp?: number;
};

/**
 * Creates a session cookie with JWT token
 */
export async function createSessionCookie(payload: Omit<JWTPayload, "exp">) {
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + COOKIE_MAX_AGE * 1000);

  const token = await new SignJWT({
    sub: payload.sub,
    role: payload.role,
    readAccess: payload.readAccess,
    writeAccess: payload.writeAccess,
    canLogin: payload.canLogin,
  } as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clears the session cookie by setting it to empty with maxAge: 0
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Gets the current user from the session cookie
 * Returns null if no valid session exists
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify<JWTPayload>(token, JWT_SECRET);

    if (payload.role === "SUPER_ADMIN") {
      return {
        kind: "admin",
        username: "admin",
        role: "SUPER_ADMIN",
        id: "admin",
        canLogin: true,
        readAccess: true,
        writeAccess: true,
      };
    }

    if (payload.role === "ADMIN" && payload.sub) {
      return {
        kind: "admin-member",
        accountId: payload.sub,
        id: payload.sub,
        role: "ADMIN",
        readAccess: payload.readAccess ?? true,
        writeAccess: payload.writeAccess ?? true,
        canLogin: payload.canLogin ?? true,
      };
    }

    if (payload.role === "MEMBER" && payload.sub) {
      return {
        kind: "member",
        accountId: payload.sub,
        id: payload.sub,
        role: "MEMBER",
        readAccess: payload.readAccess ?? true,
        writeAccess: payload.writeAccess ?? false,
        canLogin: payload.canLogin ?? false,
      };
    }

    return null;
  } catch {
    // Invalid token, expired, or malformed
    return null;
  }
}

/**
 * Gets the current user as AuthUser type (simplified)
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.kind === "admin") {
    return {
      id: "admin",
      role: "SUPER_ADMIN",
      readAccess: true,
      writeAccess: true,
      canLogin: true,
    };
  }

  if (user.kind === "admin-member") {
    return {
      id: user.accountId,
      role: "ADMIN",
      readAccess: user.readAccess,
      writeAccess: user.writeAccess,
      canLogin: user.canLogin,
    };
  }

  return {
    id: user.accountId,
    role: "MEMBER",
    readAccess: user.readAccess,
    writeAccess: user.writeAccess,
    canLogin: user.canLogin,
  };
}

/**
 * Requires authentication - throws if no user
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Requires write access - throws if user doesn't have write permission
 * Note: Write access is restricted to transactions only, not account/member management
 */
export async function requireWriteAccess(): Promise<CurrentUser> {
  const user = await requireAuth();

  if (user.kind === "admin") {
    return user;
  }

  if (user.kind === "admin-member") {
    return user;
  }

  if (user.kind === "member" && user.writeAccess) {
    return user;
  }

  throw new Error("FORBIDDEN_WRITE");
}

/**
 * Helper to check if user can manage accounts (members/vendors)
 * Only admins can manage accounts - Write users cannot
 */
export function canManageAccounts(user: CurrentUser): boolean {
  return user.kind === "admin" || user.kind === "admin-member";
}

/**
 * Helper to check if user can edit transactions
 * Admins and Write users can edit transactions
 */
export function canManageTransactions(user: CurrentUser): boolean {
  if (user.kind === "admin" || user.kind === "admin-member") {
    return true;
  }
  if (user.kind === "member" && user.writeAccess) {
    return true;
  }
  return false;
}

/**
 * Requires admin access (SUPER_ADMIN or ADMIN role) - throws if not admin
 * Allows creating/editing accounts, members, vendors, etc.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireAuth();

  if (user.kind === "admin" || user.kind === "admin-member") {
    return user;
  }

  throw new Error("FORBIDDEN_ADMIN");
}

/**
 * Requires super admin access only - throws if not super admin
 * Only SUPER_ADMIN (from ENV) can access this
 */
export async function requireSuperAdmin(): Promise<{
  kind: "admin";
  username: "admin";
  role: "SUPER_ADMIN";
  id: "admin";
}> {
  const user = await requireAuth();

  if (user.kind === "admin") {
    return user;
  }

  throw new Error("FORBIDDEN_SUPER_ADMIN");
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
