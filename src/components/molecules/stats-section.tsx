"use client";

import {
  ArrowDownCircle,
  Banknote,
  Briefcase,
  CalendarDays,
  CircleDollarSign,
  Clock,
  Coins,
  Crown,
  Hand,
  Layers,
  Receipt,
  Scale,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { ModernStatCard } from "./modern-stat-card";

import { clubAge } from "@/lib/core/date";

// Type definition for statistics (matches enhanced-charts-section)
type TransformedStatistics = {
  membersCount?: number;
  currentClubBalance: number;
  currentClubNetValue: number;
  totalLoanBalance: number;
  totalVendorHolding: number;
  totalInterestBalance: number;
  totalOffsetBalance: number;
  totalMemberPeriodicDepositsBalance: number;
  totalMemberPeriodicDeposits: number;
  totalMemberProfitWithdrawals?: number;
  totalOffsetAmount?: number;
  totalVendorProfit: number;
  totalInterestPaid: number;
};

interface StatsSectionProps {
  statistics: TransformedStatistics;
}

export function StatsSection({ statistics }: StatsSectionProps) {
  const club = clubAge();

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

  // Calculate derived values
  const totalInvested =
    statistics.totalLoanBalance + statistics.totalVendorHolding;
  const pendingAmounts =
    statistics.totalInterestBalance +
    statistics.totalOffsetBalance +
    statistics.totalMemberPeriodicDepositsBalance;
  // Current Portfolio Value should be the Net Value
  const currentPortfolioValue = statistics.currentClubNetValue;
  // Net Value should be Current Portfolio Value + Pending Amounts
  const netValue = currentPortfolioValue + pendingAmounts;

  const kpiGroups = [
    {
      title: "MEMBERS OVERVIEW",
      cards: [
        {
          title: "Active Members",
          value: `${statistics.membersCount ?? 0}`,
          icon: <Users className="h-5 w-5" />,
          iconBgColor: "#E3F2FD",
        },
        {
          title: "Club Age",
          value: `${club.inMonth} months`,
          icon: <CalendarDays className="h-5 w-5" />,
          iconBgColor: "#EDE7F6",
        },
      ],
    },
    {
      title: "MEMBER FUNDS",
      cards: [
        {
          title: "Member Deposits",
          value: formatCurrency(statistics.totalMemberPeriodicDeposits),
          icon: <CircleDollarSign className="h-5 w-5" />,
          iconBgColor: "#E8F5E9",
        },
        {
          title: "Member Balance",
          value: formatCurrency(statistics.totalMemberPeriodicDepositsBalance),
          icon: <Wallet className="h-5 w-5" />,
          iconBgColor: "#FFF3E0",
        },
      ],
    },
    {
      title: "MEMBER OUTFLOW",
      cards: [
        {
          title: "Withdrawals",
          value: formatCurrency(statistics.totalMemberProfitWithdrawals ?? 0),
          icon: <ArrowDownCircle className="h-5 w-5" />,
          iconBgColor: "#FBE9E7",
        },
        {
          title: "Member Adjustments",
          value: formatCurrency(statistics.totalOffsetAmount ?? 0),
          icon: <SlidersHorizontal className="h-5 w-5" />,
          iconBgColor: "#E1F5FE",
        },
      ],
    },
    {
      title: "LOAN SUMMARY",
      cards: [
        {
          title: "Loan Taken",
          value: formatCurrency(statistics.totalLoanBalance),
          icon: <Hand className="h-5 w-5" />,
          iconBgColor: "#F3E5F5",
        },
        {
          title: "Interest Collected",
          value: formatCurrency(statistics.totalInterestPaid),
          icon: <Coins className="h-5 w-5" />,
          iconBgColor: "#E8F5E9",
        },
        {
          title: "Interest Balance",
          value: formatCurrency(statistics.totalInterestBalance),
          icon: <Scale className="h-5 w-5" />,
          iconBgColor: "#FFF8E1",
        },
      ],
    },
    {
      title: "VENDOR TRANSACTIONS",
      cards: [
        {
          title: "Vendor Investment",
          value: formatCurrency(statistics.totalVendorHolding || 0),
          icon: <Briefcase className="h-5 w-5" />,
          iconBgColor: "#FFF3E0",
        },
        {
          title: "Vendor Profit",
          value: formatCurrency(statistics.totalVendorProfit),
          icon: <Receipt className="h-5 w-5" />,
          iconBgColor: "#E8F5E9",
        },
      ],
    },
    {
      title: "CASH FLOW POSITION",
      cards: [
        {
          title: "Available Cash",
          value: formatCurrency(statistics.currentClubBalance),
          icon: <Banknote className="h-5 w-5" />,
          iconBgColor: "#E3F2FD",
        },
        {
          title: "Total Invested",
          value: formatCurrency(totalInvested),
          icon: <TrendingUp className="h-5 w-5" />,
          iconBgColor: "#E8F5E9",
        },
        {
          title: "Pending Amounts",
          value: formatCurrency(pendingAmounts),
          icon: <Clock className="h-5 w-5" />,
          iconBgColor: "#F3E5F5",
        },
      ],
    },
    {
      title: "PORTFOLIO SUMMARY",
      cards: [
        {
          title: "Current Value",
          value: formatCurrency(currentPortfolioValue),
          icon: <Layers className="h-5 w-5" />,
          iconBgColor: "#E8F5E9",
        },
        {
          title: "Total Value",
          value: formatCurrency(netValue),
          icon: <Crown className="h-5 w-5" />,
          iconBgColor: "#FFF8E1",
          isHighlighted: true,
        },
      ],
    },
  ];

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
  );
}
