export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'

import prisma from '@/db'
import { requireWriteAccess } from '@/lib/core/auth'
import { transactionEntryHandler } from '@/logic/transaction-handler'

export async function POST(request: Request) {
  try {
    await requireWriteAccess()
    const body = await request.json()
    const { fromId, toId, amount, transactionType, occurredAt, description } = body

    if (!fromId || !toId || !amount || !transactionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const created = await prisma.transaction.create({
      data: {
        fromId,
        toId,
        amount: Number(amount),
        type: transactionType,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        description: description || null,
        method: 'ACCOUNT',
        currency: 'INR',
      },
    })

    await transactionEntryHandler(created as any)

    return NextResponse.json({ transaction: created }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
    if (
      error?.message === 'UNAUTHORIZED' ||
      error?.message === 'FORBIDDEN_WRITE' ||
      error?.message === 'FORBIDDEN_ADMIN'
    ) {
      const { handleAuthError } = await import('@/lib/core/error-handler')
      return handleAuthError(error)
    }
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}


