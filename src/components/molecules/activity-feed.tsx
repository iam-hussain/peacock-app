'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  AlertCircle,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { fetchTransactions } from '@/lib/query-options'
import { moneyFormat, cn } from '@/lib/utils'

interface ActivityFeedProps {
  limit?: number
}

type TransactionType =
  | 'PERIODIC_DEPOSIT'
  | 'OFFSET_DEPOSIT'
  | 'WITHDRAW'
  | 'LOAN_TAKEN'
  | 'LOAN_REPAY'
  | 'LOAN_INTEREST'
  | 'VENDOR_INVEST'
  | 'VENDOR_RETURNS'
  | 'FUNDS_TRANSFER'
  | 'REJOIN'

interface ActivityItem {
  id: string
  type: TransactionType
  amount: number
  fromName?: string
  toName?: string
  fromSub?: string
  toSub?: string
  transactionAt: number
  description?: string
}

function getActivityIcon(type: TransactionType) {
  switch (type) {
    case 'PERIODIC_DEPOSIT':
    case 'OFFSET_DEPOSIT':
    case 'VENDOR_RETURNS':
    case 'REJOIN':
      return <ArrowDownCircle className="h-4 w-4 text-green-600" />
    case 'WITHDRAW':
    case 'LOAN_TAKEN':
    case 'VENDOR_INVEST':
      return <ArrowUpCircle className="h-4 w-4 text-red-600" />
    case 'LOAN_REPAY':
    case 'LOAN_INTEREST':
      return <CreditCard className="h-4 w-4 text-blue-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />
  }
}

function getActivityLabel(
  type: TransactionType,
  fromName?: string,
  toName?: string,
  fromSub?: string,
  toSub?: string
) {
  // Helper to get member/vendor name, excluding Club Account but allowing Loan Account names
  const getMemberName = (name?: string, sub?: string) => {
    if (sub === 'Club Account') {
      return null // Don't show club account as names
    }
    // For Loan Account, still show the member name
    return name?.trim() || null
  }

  switch (type) {
    case 'PERIODIC_DEPOSIT':
      // Deposit FROM member TO club
      return `Deposit from ${getMemberName(fromName, fromSub) || 'Member'}`
    case 'OFFSET_DEPOSIT':
      // Offset deposit FROM member TO club
      return `Offset deposit from ${getMemberName(fromName, fromSub) || 'Member'}`
    case 'WITHDRAW':
      // Withdrawal FROM club TO member
      return `Withdrawal by ${getMemberName(toName, toSub) || 'Member'}`
    case 'LOAN_TAKEN':
      // Loan FROM club TO member (loan account)
      // For loan taken, the member name is in toName even if toSub is "Loan Account"
      const loanTakenMember = toName?.trim() && toSub !== 'Club Account' 
        ? toName.trim() 
        : null
      return `Loan taken by ${loanTakenMember || 'Member'}`
    case 'LOAN_REPAY':
      // Repayment FROM member TO club
      // For loan repay, the member name is in fromName even if fromSub is "Loan Account"
      const loanRepayMember = fromName?.trim() && fromSub !== 'Club Account'
        ? fromName.trim()
        : null
      return `Loan repayment by ${loanRepayMember || 'Member'}`
    case 'LOAN_INTEREST':
      // Interest FROM member TO club
      const interestMember = fromName?.trim() && fromSub !== 'Club Account'
        ? fromName.trim()
        : null
      return `Interest payment from ${interestMember || 'Member'}`
    case 'VENDOR_INVEST':
      // Investment FROM club TO vendor
      return `Investment to ${getMemberName(toName, toSub) || 'Vendor'}`
    case 'VENDOR_RETURNS':
      // Returns FROM vendor TO club
      return `Returns from ${getMemberName(fromName, fromSub) || 'Vendor'}`
    case 'FUNDS_TRANSFER':
      // Transfer between accounts
      const from = getMemberName(fromName, fromSub) || fromSub || 'Account'
      const to = getMemberName(toName, toSub) || toSub || 'Account'
      return `Transfer: ${from} → ${to}`
    case 'REJOIN':
      // Rejoin FROM member TO club
      return `Rejoin by ${getMemberName(fromName, fromSub) || 'Member'}`
    default:
      return 'Transaction'
  }
}

function getActivityColor(type: TransactionType) {
  switch (type) {
    case 'PERIODIC_DEPOSIT':
    case 'OFFSET_DEPOSIT':
    case 'VENDOR_RETURNS':
    case 'REJOIN':
      return 'text-green-600'
    case 'WITHDRAW':
    case 'LOAN_TAKEN':
    case 'VENDOR_INVEST':
      return 'text-red-600'
    case 'LOAN_REPAY':
    case 'LOAN_INTEREST':
      return 'text-blue-600'
    default:
      return 'text-muted-foreground'
  }
}

export function ActivityFeed({ limit = 10 }: ActivityFeedProps) {
  const { data, isLoading } = useQuery(
    fetchTransactions({
      page: 1,
      limit,
      accountId: '',
      transactionType: '',
      sortField: 'transactionAt',
      sortOrder: 'desc',
    })
  )

  const activities: ActivityItem[] =
    data?.transactions?.map((tx: any) => ({
      id: tx.id,
      type: tx.transactionType,
      amount: tx.amount,
      fromName: tx.from?.name || tx.fromName,
      toName: tx.to?.name || tx.toName,
      fromSub: tx.from?.sub,
      toSub: tx.to?.sub,
      transactionAt: tx.transactionAt,
      description: tx.description,
    })) || []

  if (isLoading) {
    return (
      <Card className="rounded-xl border-border/50 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border-border/50 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                <div className="mt-0.5 shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {getActivityLabel(
                      activity.type,
                      activity.fromName,
                      activity.toName,
                      activity.fromSub,
                      activity.toSub
                    )}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        getActivityColor(activity.type)
                      )}
                    >
                      {moneyFormat(activity.amount)}
                    </p>
                    <span className="text-xs text-muted-foreground">·</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.transactionAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No recent activity
          </div>
        )}
      </CardContent>
    </Card>
  )
}

