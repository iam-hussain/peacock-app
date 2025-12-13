export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'

import prisma from '@/db'
import { createSessionCookie, verifyPassword } from '@/lib/core/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin'
    const adminPassword =
      process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD

    // Super admin login
    if (username === adminUsername) {
      if (!adminPassword) {
        return NextResponse.json(
          { error: 'Admin authentication not configured' },
          { status: 500 }
        )
      }

      if (password !== adminPassword) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        )
      }

      await createSessionCookie({
        sub: 'admin',
        role: 'SUPER_ADMIN',
        accessLevel: 'ADMIN',
        canLogin: true,
      })

      return NextResponse.json(
        {
          message: 'Login successful',
          user: { kind: 'admin', username: 'admin', role: 'SUPER_ADMIN' },
        },
        { status: 200 }
      )
    }

    // Member/Admin login - try username or email
    const account = await prisma.account.findFirst({
      where: {
        OR: [{ username: username }, { email: username }],
        type: 'MEMBER',
        active: true,
      },
      select: {
        id: true,
        role: true,
        accessLevel: true,
        passwordHash: true,
        canLogin: true,
      },
    })

    if (!account) {
      // Don't reveal if account exists - security best practice
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Check if login is enabled
    if (!account.canLogin) {
      return NextResponse.json(
        {
          error:
            'Login is disabled for this account. Please contact the club admin.',
        },
        { status: 403 }
      )
    }

    // Check if account has password set
    if (!account.passwordHash) {
      return NextResponse.json(
        { error: 'Account not set up for login. Please contact admin.' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      password,
      account.passwordHash
    )

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    })

    // Create session
    await createSessionCookie({
      sub: account.id,
      role: account.role,
      accessLevel: account.accessLevel,
      canLogin: account.canLogin,
    })

    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          kind: account.role === 'ADMIN' ? ('admin-member' as const) : ('member' as const),
          accountId: account.id,
          role: account.role,
          accessLevel: account.accessLevel,
          canLogin: account.canLogin,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
