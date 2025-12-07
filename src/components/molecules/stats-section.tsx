'use client'

import {
  Users,
  CalendarDays,
  Wallet,
  ArrowDownCircle,
  SlidersHorizontal,
  Hand,
  Coins,
  Scale,
  Banknote,
  TrendingUp,
  Clock,
  Briefcase,
  Receipt,
  Layers,
  Crown,
  CircleDollarSign,
} from 'lucide-react'

import { ModernStatCard } from './modern-stat-card'
import { clubAge } from '@/lib/date'
import { TransformedStatistics } from '@/app/api/statistics/route'

interface StatsSectionProps {
  statistics: TransformedStatistics
}

export function StatsSection({ statistics }: StatsSectionProps) {
  const club = clubAge()

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    })

  // Calculate derived values
  const totalInvested = statistics.totalLoanBalance + statistics.totalVendorHolding
  const pendingAmounts =
    statistics.totalInterestBalance +
    statistics.totalOffsetBalance +
    statistics.totalMemberPeriodicDepositsBalance
  // Current Portfolio Value should be the Net Value
  const currentPortfolioValue = statistics.currentClubNetValue
  // Net Value should be Current Portfolio Value + Pending Amounts
  const netValue = currentPortfolioValue + pendingAmounts

  const kpiGroups = [
    {
      title: 'MEMBERS OVERVIEW',
      cards: [
        {
          title: 'Active Members',
          value: `${statistics.membersCount}`,
          icon: <Users className="h-5 w-5" />,
          iconBgColor: '#E3F2FD',
        },
        {
          title: 'Club Age',
          value: `${club.inMonth} months`,
          icon: <CalendarDays className="h-5 w-5" />,
          iconBgColor: '#EDE7F6',
        },
      ],
    },
    {
      title: 'MEMBER FUNDS',
      cards: [
        {
          title: 'Total Deposits',
          value: formatCurrency(statistics.totalMemberPeriodicDeposits),
          icon: <CircleDollarSign className="h-5 w-5" />,
          iconBgColor: '#E8F5E9',
        },
        {
          title: 'Member Balance',
          value: formatCurrency(statistics.totalMemberPeriodicDepositsBalance),
          icon: <Wallet className="h-5 w-5" />,
          iconBgColor: '#FFF3E0',
        },
      ],
    },
    {
      title: 'MEMBER OUTFLOW',
      cards: [
        {
          title: 'Withdrawals',
          value: formatCurrency(statistics.totalMemberProfitWithdrawals),
          icon: <ArrowDownCircle className="h-5 w-5" />,
          iconBgColor: '#FBE9E7',
        },
        {
          title: 'Member Adjustments',
          value: formatCurrency(statistics.totalOffsetAmount),
          icon: <SlidersHorizontal className="h-5 w-5" />,
          iconBgColor: '#E1F5FE',
        },
      ],
    },
    {
      title: 'LOAN SUMMARY',
      cards: [
        {
          title: 'Loan Taken',
          value: formatCurrency(statistics.totalLoanBalance),
          icon: <Hand className="h-5 w-5" />,
          iconBgColor: '#F3E5F5',
        },
        {
          title: 'Interest Collected',
          value: formatCurrency(statistics.totalInterestPaid),
          icon: <Coins className="h-5 w-5" />,
          iconBgColor: '#E8F5E9',
        },
        {
          title: 'Interest Balance',
          value: formatCurrency(statistics.totalInterestBalance),
          icon: <Scale className="h-5 w-5" />,
          iconBgColor: '#FFF8E1',
        },
      ],
    },
    {
      title: 'VENDOR TRANSACTIONS',
      cards: [
        {
          title: 'Vendor Investment',
          value: formatCurrency(statistics.totalVendorHolding || 0),
          icon: <Briefcase className="h-5 w-5" />,
          iconBgColor: '#FFF3E0',
        },
        {
          title: 'Vendor Profit',
          value: formatCurrency(statistics.totalVendorProfit),
          icon: <Receipt className="h-5 w-5" />,
          iconBgColor: '#E8F5E9',
        },
      ],
    },
    {
      title: 'CASH FLOW POSITION',
      cards: [
        {
          title: 'Available Cash',
          value: formatCurrency(statistics.currentClubBalance),
          icon: <Banknote className="h-5 w-5" />,
          iconBgColor: '#E3F2FD',
        },
        {
          title: 'Total Invested',
          value: formatCurrency(totalInvested),
          icon: <TrendingUp className="h-5 w-5" />,
          iconBgColor: '#E8F5E9',
        },
        {
          title: 'Pending Amounts',
          value: formatCurrency(pendingAmounts),
          icon: <Clock className="h-5 w-5" />,
          iconBgColor: '#F3E5F5',
        },
      ],
    },
    {
      title: 'PORTFOLIO SUMMARY',
      cards: [
        {
          title: 'Current Value',
          value: formatCurrency(currentPortfolioValue),
          icon: <Layers className="h-5 w-5" />,
          iconBgColor: '#E8F5E9',
        },
        {
          title: 'Total Value',
          value: formatCurrency(netValue),
          icon: <Crown className="h-5 w-5" />,
          iconBgColor: '#FFF8E1',
          isHighlighted: true,
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {kpiGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.cards.map((card, cardIndex) => (
              <ModernStatCard
                key={cardIndex}
                title={card.title}
                value={card.value}
                icon={card.icon}
                iconBgColor={card.iconBgColor}
                isHighlighted={card.isHighlighted}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
