# Authentication Implementation Guide

## Overview

This document describes the complete authentication and authorization system for Peacock Club dashboard app, implemented using Next.js 14, jose, cookies, and Prisma.

## Architecture

### Authentication Flow

1. **Login**: User submits username/email + password
2. **Validation**: Server validates credentials (Super Admin from ENV, Members from DB)
3. **Session Creation**: JWT token created and stored in HTTP-only cookie
4. **Route Protection**: Middleware checks session for `/dashboard/**` routes
5. **Logout**: Cookie cleared and user redirected to home

### Authorization Levels

- **SUPER_ADMIN**: Virtual user (not in DB), defined via `ADMIN_USERNAME` and `ADMIN_PASSWORD` env vars
- **MEMBER**: Stored in Account table with `canRead` and `canWrite` flags

## Prisma Schema Updates

### New Fields

```prisma
enum USER_ROLE {
  SUPER_ADMIN
  MEMBER
}

model Account {
  // ... existing fields
  username  String?  @unique  // for login
  email     String?  @unique  // for login
  passwordHash String?  // bcrypt hash
  role      USER_ROLE @default(MEMBER)
  canRead   Boolean @default(true)
  canWrite  Boolean @default(false)
  // ... audit fields
}
```

### Migration Steps

1. Run `npx prisma format` to format schema
2. Run `npx prisma generate` to regenerate client
3. For existing data, you may need to:
   - Set `role: MEMBER` for all existing accounts
   - Ensure `username` or `email` is unique
   - Hash passwords for existing members

## Environment Variables

Add to `.env`:

```env
# JWT Secret (use a strong random string in production)
JWT_SECRET=your-secret-key-here

# Super Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password-here

# Database
DATABASE_URL=your-mongodb-connection-string
```

## Key Files

### 1. `/src/lib/auth.ts`

Core authentication utilities:

- `createSessionCookie()`: Creates JWT and sets HTTP-only cookie
- `clearSessionCookie()`: Clears session cookie
- `getCurrentUser()`: Verifies JWT and returns user object
- `requireAuth()`: Throws if no user
- `requireWriteAccess()`: Throws if user can't write
- `requireSuperAdmin()`: Throws if not super admin
- `hashPassword()` / `verifyPassword()`: Bcrypt utilities

### 2. `/src/app/api/auth/login/route.ts`

Login endpoint:

- Validates input
- Checks Super Admin credentials (from ENV)
- Looks up member by username or email
- Verifies password with bcrypt
- Creates session cookie
- Returns user object

**Error Messages:**
- "Username and password are required" (400)
- "Invalid username or password" (401) - for wrong credentials
- "Account not set up for login" (401) - no password hash
- "Account does not have read access" (403)

### 3. `/src/app/api/auth/logout/route.ts`

Logout endpoint:

- Clears session cookie
- Returns success message

### 4. `/src/app/api/auth/status/route.ts`

Auth status endpoint:

- Returns `{ isLoggedIn: boolean, user: CurrentUser | null }`
- Used by client-side `useAuth()` hook

### 5. `/src/middleware.ts`

Route protection:

- Protects all `/dashboard/**` routes
- Verifies JWT token from cookie
- Redirects to `/` if no valid session
- Clears invalid cookies

### 6. `/src/app/dashboard/layout.tsx`

Dashboard layout:

- Uses `useAuth()` hook to check login state
- Redirects to `/` if not logged in
- Shows loading state while checking auth

## Usage Examples

### Server-Side (API Routes / Server Components)

```typescript
import { getCurrentUser, requireAuth, requireSuperAdmin } from "@/lib/auth";

// Get current user (returns null if not logged in)
const user = await getCurrentUser();

// Require authentication (throws if not logged in)
const user = await requireAuth();

// Require super admin
const admin = await requireSuperAdmin();

// Require write access
const user = await requireWriteAccess();
```

### Client-Side (React Components)

```typescript
import { useAuth } from "@/hooks/use-auth";

function MyComponent() {
  const { user, isLoggedIn, isAdmin, canWrite, canRead } = useAuth();

  if (!isLoggedIn) {
    return <div>Please log in</div>;
  }

  if (isAdmin) {
    return <AdminPanel />;
  }

  return <MemberView />;
}
```

## Seeding a Sample Member

```typescript
import { hashPassword } from "@/lib/auth";
import prisma from "@/db";

async function seedMember() {
  const passwordHash = await hashPassword("member123");

  await prisma.account.create({
    data: {
      firstName: "John",
      lastName: "Doe",
      slug: "john-doe",
      username: "johndoe", // or email: "john@example.com"
      passwordHash,
      email: "john@example.com",
      role: "MEMBER",
      canRead: true,
      canWrite: false, // Set to true to allow transaction creation
      active: true,
      isMember: true,
      // ... other required fields
    },
  });
}
```

## Testing Authentication

### 1. Test Super Admin Login

```bash
# Set in .env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=peacock

# Login with:
Username: admin
Password: peacock
```

### 2. Test Member Login

```bash
# Create member with password hash
# Login with username or email
Username: johndoe (or john@example.com)
Password: member123
```

### 3. Test Logout

- Click logout button
- Should redirect to `/`
- Cookie should be cleared
- Dashboard routes should redirect to `/`

### 4. Test Route Protection

- Try accessing `/dashboard` without login → should redirect to `/`
- Try accessing `/dashboard/settings` without login → should redirect to `/`
- After login, all dashboard routes should be accessible

## UI State Management

### Home Page (`/`)

- **Not Logged In**: Shows Login button, login form in hero
- **Logged In**: Shows Dashboard, Profile, Settings buttons

### Dashboard Routes (`/dashboard/**`)

- **Not Logged In**: Middleware redirects to `/`
- **Logged In**: Shows full dashboard with navigation

### Header / Navigation

- **Not Logged In**: Login button only
- **Logged In**: Dashboard, Profile, Settings, Logout

## Security Best Practices

1. **HTTP-Only Cookies**: Prevents XSS attacks
2. **Secure Cookies**: Enabled in production
3. **SameSite: Lax**: Prevents CSRF attacks
4. **JWT Expiration**: 7 days (configurable)
5. **Password Hashing**: Bcrypt with salt rounds
6. **Error Messages**: Don't reveal if account exists
7. **Route Protection**: Middleware checks all dashboard routes

## Troubleshooting

### Login Not Working

1. Check `JWT_SECRET` is set in `.env`
2. Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` for super admin
3. Verify member has `passwordHash` set
4. Check member `active` and `canRead` flags
5. Verify username/email is correct

### Logout Not Working

1. Check cookie is being cleared (browser DevTools → Application → Cookies)
2. Verify `clearSessionCookie()` is called
3. Check redirect is happening after logout

### Route Protection Not Working

1. Check middleware is running (add console.log)
2. Verify JWT_SECRET matches between login and middleware
3. Check cookie name is "session" (matches COOKIE_NAME in auth.ts)

### UI State Issues

1. Check `useAuth()` hook is being used correctly
2. Verify `fetchAuthStatus` query is invalidated after login/logout
3. Check Redux state is updated correctly

## Next Steps

1. Run Prisma migration: `npx prisma migrate dev --name add_auth_fields`
2. Seed a test member with password
3. Test login/logout flow
4. Test route protection
5. Test role-based UI visibility

