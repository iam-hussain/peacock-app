/* eslint-disable unused-imports/no-unused-vars */

import { endOfMonth, startOfMonth } from 'date-fns'

import { updatePassbookByTransaction } from './transaction-handler'

import prisma from '@/db'
import { clearCache } from '@/lib/core/cache'
import { calculateMonthlySnapshotFromPassbooks } from '@/lib/calculators/dashboard-calculator'
import { calculateInterestByAmount } from '@/lib/helper'
import {
  bulkPassbookUpdate,
  fetchAllPassbook,
  initializePassbookToUpdate,
} from '@/lib/helper'
import { calculateLoanDetails } from '@/lib/calculators/loan-calculator'
import { PassbookToUpdate } from '@/lib/validators/type'
import { vendorCalcHandler } from '@/logic/vendor-middleware'

export async function resetAllTransactionMiddlewareHandler(
  shouldUpdatePassbooks = true,
  shouldUpdateDashboard = true
) {
  clearCache()
  await prisma.summary.deleteMany()

  const [transactions, passbooks, activeMemberCount] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { occurredAt: 'asc' } }),
    fetchAllPassbook(),
    prisma.account.count({ where: { type: 'MEMBER', active: true } }),
  ])

  // Cast passbooks to expected type for initializePassbookToUpdate
  let passbookToUpdate = initializePassbookToUpdate(passbooks as any, true)

  if (transactions.length === 0 && shouldUpdatePassbooks) {
    // No transactions, just update passbooks
    await bulkPassbookUpdate(passbookToUpdate)
    return
  }

  // Group transactions by month
  const transactionsByMonth: Map<string, typeof transactions> = new Map()
  transactions.forEach((tx) => {
    const monthKey = startOfMonth(tx.occurredAt).toISOString()
    if (!transactionsByMonth.has(monthKey)) {
      transactionsByMonth.set(monthKey, [])
    }
    transactionsByMonth.get(monthKey)!.push(tx)
  })

  // Sort months chronologically
  const sortedMonths = Array.from(transactionsByMonth.keys()).sort()

  // Monthly snapshots to create
  const monthlySnapshots: any[] = []

  // Process each month
  for (const monthKey of sortedMonths) {
    const monthTransactions = transactionsByMonth.get(monthKey)!
    const monthStart = new Date(monthKey)
    const monthEnd = endOfMonth(monthStart)

    // Process all transactions for this month
    for (const transaction of monthTransactions) {
      passbookToUpdate = updatePassbookByTransaction(
        passbookToUpdate,
        transaction
      )
    }

    // Calculate vendor profits after transactions
    const vendorIds = Array.from(passbookToUpdate.keys()).filter(
      (id) => passbookToUpdate.get(id)?.data.kind === 'VENDOR'
    )
    passbookToUpdate = vendorCalcHandler(passbookToUpdate, vendorIds)

    // Calculate loan interest for this month
    const loanAccounts = Array.from(passbookToUpdate.keys()).filter((id) => {
      const pb = passbookToUpdate.get(id)
      return pb?.data.kind === 'MEMBER'
    })

    for (const accountId of loanAccounts) {
      const passbook = passbookToUpdate.get(accountId)
      if (!passbook) continue

      // loanHistory is stored as JSON, need to parse it
      const loanHistoryData = passbook.data.loanHistory as any
      const loanTransactions = Array.isArray(loanHistoryData) ? loanHistoryData : []

      const loanDetails = calculateLoanDetails(loanTransactions)
      if (loanDetails && typeof loanDetails.totalLoanBalance === 'number' && loanDetails.totalLoanBalance > 0) {
        const interestResult = calculateInterestByAmount(
          loanDetails.totalLoanBalance,
          monthStart,
          monthEnd
        )
        if (interestResult.interestAmount > 0) {
          passbookToUpdate = updatePassbookByTransaction(passbookToUpdate, {
            id: `loan-interest-${accountId}-${monthKey}`,
            fromId: accountId,
            toId: 'CLUB',
            amount: interestResult.interestAmount,
            type: 'LOAN_INTEREST',
            occurredAt: monthEnd,
            method: 'ACCOUNT',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any)
        }
      }
    }

    // Create monthly snapshot if needed
    if (shouldUpdateDashboard) {
      const snapshot = await calculateMonthlySnapshotFromPassbooks(
        monthStart,
        passbookToUpdate,
        activeMemberCount,
        0 // expectedTotalLoanInterestAmount - calculate if needed
      )
      if (snapshot) {
        monthlySnapshots.push(snapshot)
      }
    }
  }

  // Bulk insert monthly snapshots
  if (monthlySnapshots.length > 0 && shouldUpdateDashboard) {
    await prisma.summary.createMany({
      data: monthlySnapshots,
    })
  }

  if (shouldUpdatePassbooks) {
    await bulkPassbookUpdate(passbookToUpdate)
  }

  clearCache()
}
