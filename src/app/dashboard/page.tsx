"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  Banknote,
  Briefcase,
  CalendarDays,
  CircleDollarSign,
  Clock,
  Coins,
  Crown,
  FileText,
  HandCoins,
  Hourglass,
  Layers,
  Scale,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

import { ActivityFeed } from "@/components/molecules/activity-feed";
import { EnhancedChartsSection } from "@/components/molecules/enhanced-charts-section";
import { MembersPreview } from "@/components/molecules/members-preview";
import { ModernStatCard } from "@/components/molecules/modern-stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { clubAge } from "@/lib/date";
import { fetchStatistics } from "@/lib/query-options";

export default function DashboardPage() {
  const { data, isLoading } = useQuery(fetchStatistics());
  const statistics = data?.statistics;
  const members = data?.members || [];

  const club = clubAge();

  const formatCurrency = (value: number) =>
    (value || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

  // Calculate derived values (use 0 as fallback when loading)
  const totalInvested = statistics
    ? statistics.totalLoanBalance + statistics.totalVendorHolding
    : 0;
  const pendingAmounts = statistics
    ? statistics.totalInterestBalance +
      statistics.totalOffsetBalance +
      statistics.totalMemberPeriodicDepositsBalance
    : 0;
  const currentPortfolioValue = statistics?.currentClubNetValue || 0;
  const netValue = currentPortfolioValue + pendingAmounts;
  const availableCash = statistics
    ? statistics.currentClubNetValue -
      statistics.totalLoanBalance -
      statistics.totalVendorHolding
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your financial club management
        </p>
      </div>

      {/* KPI Row - 2 Cards with 1 placeholder */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ModernStatCard
          title="Active Members"
          value={
            isLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              statistics?.membersCount || 0
            )
          }
          icon={<Users className="h-5 w-5" />}
          iconBgColor="#E3F2FD"
        />
        <ModernStatCard
          title="Club Age"
          value={
            isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              `${club.inMonth} months`
            )
          }
          icon={<CalendarDays className="h-5 w-5" />}
          iconBgColor="#EDE7F6"
        />
        {/* Invisible placeholder for 3-column alignment */}
        <div className="hidden xl:block" aria-hidden="true" />
      </div>

      {/* Financial Summary Sections */}
      <div className="space-y-6">
        {/* MEMBER FUNDS */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Member Funds
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ModernStatCard
              title="Total Deposits"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(statistics?.totalMemberPeriodicDeposits || 0)
                )
              }
              icon={<CircleDollarSign className="h-5 w-5" />}
              iconBgColor="#E8F5E9"
            />
            <ModernStatCard
              title="Member Balance"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(
                    statistics?.totalMemberPeriodicDepositsBalance || 0
                  )
                )
              }
              icon={<Wallet className="h-5 w-5" />}
              iconBgColor="#FFF3E0"
            />
            {/* Invisible placeholder for 3-column alignment */}
            <div className="hidden xl:block" aria-hidden="true" />
          </div>
        </div>

        {/* MEMBER OUTFLOW */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Member Outflow
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ModernStatCard
              title="Profit Withdrawals"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(statistics?.totalMemberProfitWithdrawals || 0)
                )
              }
              icon={<ArrowDownCircle className="h-5 w-5" />}
              iconBgColor="#FBE9E7"
            />
            <ModernStatCard
              title="Member Adjustments"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(statistics?.totalOffsetAmount || 0)
                )
              }
              icon={<SlidersHorizontal className="h-5 w-5" />}
              iconBgColor="#F3E5F5"
            />
            {/* Invisible placeholder for 3-column alignment */}
            <div className="hidden xl:block" aria-hidden="true" />
          </div>
        </div>

        {/* LOAN SUMMARY */}
        <div className="space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Loan Summary
          </h3>

          {/* Section 1: Total Loan (Lifetime Summary) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Lifetime
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ModernStatCard
                title="Total Loan Given"
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(statistics?.totalLoanTaken || 0)
                  )
                }
                icon={<HandCoins className="h-5 w-5" />}
                iconBgColor="#2563EB"
              />
              <ModernStatCard
                title="Total Interest Collected"
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(statistics?.totalInterestPaid || 0)
                  )
                }
                icon={<TrendingUp className="h-5 w-5" />}
                iconBgColor="#16A34A"
              />
            </div>
          </div>

          {/* Section 2: Current Loan (Outstanding Summary) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-amber-500" />
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Active / Outstanding
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ModernStatCard
                title="Current Loan Taken"
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(statistics?.totalLoanBalance || 0)
                  )
                }
                icon={<FileText className="h-5 w-5" />}
                iconBgColor="#F59E0B"
              />
              <ModernStatCard
                title="Interest Balance"
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(statistics?.totalInterestBalance || 0)
                  )
                }
                icon={<Hourglass className="h-5 w-5" />}
                iconBgColor="#EAB308"
              />
            </div>
          </div>
        </div>

        {/* VENDOR TRANSACTIONS */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Vendor Transactions
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ModernStatCard
              title="Vendor Investment"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(statistics?.totalVendorHolding || 0)
                )
              }
              icon={<Briefcase className="h-5 w-5" />}
              iconBgColor="#E3F2FD"
            />
            <ModernStatCard
              title="Vendor Profit"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(statistics?.totalVendorProfit || 0)
                )
              }
              icon={<TrendingUp className="h-5 w-5" />}
              iconBgColor="#E8F5E9"
            />
            {/* Invisible placeholder for 3-column alignment */}
            <div className="hidden xl:block" aria-hidden="true" />
          </div>
        </div>

        {/* CASH FLOW POSITION */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Cash Flow Position
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModernStatCard
              title="Total Invested"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(totalInvested)
                )
              }
              icon={<Layers className="h-5 w-5" />}
              iconBgColor="#2563EB"
            />
            <ModernStatCard
              title="Pending Amounts"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(pendingAmounts)
                )
              }
              icon={<Clock className="h-5 w-5" />}
              iconBgColor="#9333EA"
            />
          </div>
        </div>

        {/* VALUATION & CASH */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Valuation & Cash
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModernStatCard
              title="Available Cash"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(availableCash)
                )
              }
              icon={<Wallet className="h-5 w-5" />}
              iconBgColor="#F59E0B"
            />
            <ModernStatCard
              title="Current Value"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(currentPortfolioValue)
                )
              }
              icon={<Banknote className="h-5 w-5" />}
              iconBgColor="#16A34A"
            />
          </div>
        </div>
      </div>

      {/* PORTFOLIO SUMMARY - Full-width emphasized card */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Portfolio Summary
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="col-span-1 md:col-span-2 h-full flex flex-col rounded-lg border-2 border-primary/30 bg-card shadow-lg ring-2 ring-primary/10 transition-all hover:shadow-xl">
            <CardContent className="flex flex-1 flex-col p-6 md:p-8">
              <div className="flex flex-1 items-center justify-between gap-6">
                {/* Left: Label */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total Value
                  </p>
                </div>
                {/* Center: Value */}
                <div className="flex-1 text-center">
                  {isLoading ? (
                    <Skeleton className="h-10 w-48 mx-auto" />
                  ) : (
                    <p className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                      {formatCurrency(netValue)}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Total portfolio value (cash + investments + receivables)
                  </p>
                </div>
                {/* Right: Icon */}
                <div className="flex shrink-0 items-center justify-center rounded-full h-16 w-16 bg-green-500/10 dark:bg-green-500/20">
                  <div className="relative z-10 text-2xl text-green-600 dark:text-green-400">
                    <Crown className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ANALYTICS SECTION - 2 Charts Side-by-Side */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <EnhancedChartsSection statistics={statistics!} />
      )}

      {/* MEMBERS SNAPSHOT & RECENT ACTIVITY - Side by Side on Desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Members Snapshot
          </h3>
          {isLoading ? (
            <Card className="border-border/50">
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ) : (
            <MembersPreview initialMembers={members.slice(0, 16)} />
          )}
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent Activity
          </h3>
          {isLoading ? (
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <ActivityFeed limit={10} />
          )}
        </div>
      </div>
    </div>
  );

  if (!statistics) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your financial club management
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          No statistics available
        </div>
      </div>
    );
  }
}
