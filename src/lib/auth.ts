import bcrypt from "bcrypt";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production"
);

const COOKIE_NAME = "session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type CurrentUser =
  | { kind: "admin"; username: "admin"; role: "SUPER_ADMIN" }
  | {
      kind: "member";
      accountId: string;
      role: "MEMBER";
      canRead: boolean;
      canWrite: boolean;
    };

type JWTPayload = {
  sub: string; // "admin" or accountId
  role: "SUPER_ADMIN" | "MEMBER";
  canWrite: boolean;
  canRead: boolean;
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
    canWrite: payload.canWrite,
    canRead: payload.canRead,
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
      return { kind: "admin", username: "admin", role: "SUPER_ADMIN" };
    }

    if (payload.role === "MEMBER" && payload.sub) {
      return {
        kind: "member",
        accountId: payload.sub,
        role: "MEMBER",
        canRead: payload.canRead ?? true,
        canWrite: payload.canWrite ?? false,
      };
    }

    return null;
  } catch (error) {
    // Invalid token, expired, or malformed
    return null;
  }
}

/**
 * Requires authentication - throws if no user
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Requires write access - throws if user doesn't have write permission
 */
export async function requireWriteAccess(): Promise<CurrentUser> {
  const user = await requireAuth();

  if (user.kind === "admin") {
    return user;
  }

  if (user.kind === "member" && user.canWrite) {
    return user;
  }

  throw new Error("Forbidden: Write access required");
}

/**
 * Requires super admin access - throws if not super admin
 */
export async function requireSuperAdmin(): Promise<{
  kind: "admin";
  username: "admin";
  role: "SUPER_ADMIN";
}> {
  const user = await requireAuth();

  if (user.kind === "admin") {
    return user;
  }

  throw new Error("Forbidden: Super admin access required");
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
