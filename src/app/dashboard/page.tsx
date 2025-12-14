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
  Crown,
  FileText,
  HandCoins,
  Hourglass,
  Layers,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { ActivityFeed } from "@/components/molecules/activity-feed";
import { MembersPreview } from "@/components/molecules/members-preview";
import { ModernStatCard } from "@/components/molecules/modern-stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardSummary, fetchMembers } from "@/lib/query-options";

export default function DashboardPage() {
  // Month filter can be added later - for now use latest
  const selectedMonth: string | undefined = undefined;

  // Fetch dashboard summary from Summary table - NO CALCULATIONS
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useQuery(fetchDashboardSummary(selectedMonth));

  // Fetch members separately (not part of Summary)
  const { data: membersData, isLoading: isMembersLoading } =
    useQuery(fetchMembers());

  const summary = summaryData?.success ? summaryData?.data : undefined;
  const members = membersData?.members || [];

  const isLoading = isSummaryLoading || isMembersLoading;

  // Log errors for debugging
  if (summaryError || (summaryData && !summaryData.success)) {
    console.error(
      "Dashboard summary error:",
      summaryError || summaryData?.error
    );
  }

  const formatCurrency = (value: number) =>
    (value || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3">
      {/* Page Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Overview of your financial club management
            </p>
          </div>
        </div>
      </div>

      {/* KPI Row - 2 Cards */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <ModernStatCard
          title="Active Members"
          value={
            isLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              summary?.members?.activeMembers || 0
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
              `${summary?.members?.clubAgeMonths || 0} months`
            )
          }
          icon={<CalendarDays className="h-5 w-5" />}
          iconBgColor="#EDE7F6"
        />
        {/* Invisible placeholder for 3-column alignment */}
        <div className="hidden xl:block" aria-hidden="true" />
      </div>

      {/* Financial Summary Sections */}
      <div className="space-y-3">
        {/* MEMBER FUNDS */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Member Funds
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <ModernStatCard
              title="Total Deposits"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(summary?.memberFunds?.totalDeposits || 0)
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
                  formatCurrency(summary?.memberFunds?.memberBalance || 0)
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
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Member Outflow
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <ModernStatCard
              title="Profit Withdrawals"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(summary?.memberOutflow?.profitWithdrawals || 0)
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
                  formatCurrency(summary?.memberOutflow?.memberAdjustments || 0)
                )
              }
              icon={<SlidersHorizontal className="h-5 w-5" />}
              iconBgColor="#F3E5F5"
            />
            {/* Invisible placeholder for 3-column alignment */}
            <div className="hidden xl:block" aria-hidden="true" />
          </div>
        </div>

        {/* LOAN - LIFETIME */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Loan - Lifetime
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <ModernStatCard
              title="Total Loan Given"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(summary?.loans?.lifetime?.totalLoanGiven || 0)
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
                  formatCurrency(
                    summary?.loans?.lifetime?.totalInterestCollected || 0
                  )
                )
              }
              icon={<TrendingUp className="h-5 w-5" />}
              iconBgColor="#16A34A"
            />
          </div>
        </div>

        {/* LOAN - ACTIVE */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Loan - Active
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <ModernStatCard
              title="Current Loan Taken"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(
                    summary?.loans?.outstanding?.currentLoanTaken || 0
                  )
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
                  formatCurrency(
                    summary?.loans?.outstanding?.interestBalance || 0
                  )
                )
              }
              icon={<Hourglass className="h-5 w-5" />}
              iconBgColor="#EAB308"
            />
          </div>
        </div>

        {/* VENDOR TRANSACTIONS */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Vendor Transactions
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <ModernStatCard
              title="Vendor Investment"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(summary?.vendor?.vendorInvestment || 0)
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
                  formatCurrency(summary?.vendor?.vendorProfit || 0)
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
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Cash Flow Position
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <ModernStatCard
              title="Total Invested"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(summary?.cashFlow?.totalInvested || 0)
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
                  formatCurrency(summary?.cashFlow?.pendingAmounts || 0)
                )
              }
              icon={<Clock className="h-5 w-5" />}
              iconBgColor="#9333EA"
            />
          </div>
        </div>

        {/* VALUATION & CASH */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Valuation & Cash
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <ModernStatCard
              title="Available Cash"
              value={
                isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  formatCurrency(summary?.valuation?.availableCash || 0)
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
                  formatCurrency(summary?.valuation?.currentValue || 0)
                )
              }
              icon={<Banknote className="h-5 w-5" />}
              iconBgColor="#16A34A"
            />
          </div>
        </div>
      </div>

      {/* PORTFOLIO SUMMARY - Full-width emphasized card */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Portfolio Summary
        </h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <Card className="col-span-1 md:col-span-2 h-full flex flex-col rounded-lg border-2 border-primary/30 bg-card shadow-lg ring-2 ring-primary/10 transition-all hover:shadow-xl">
            <CardContent className="flex flex-1 flex-col p-4 md:p-5">
              <div className="flex flex-1 items-center justify-between gap-3">
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
                      {formatCurrency(
                        summary?.portfolio?.totalPortfolioValue || 0
                      )}
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

      {/* MEMBERS SNAPSHOT & RECENT ACTIVITY - Side by Side on Desktop */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 pt-6">
        <div className="lg:col-span-2 space-y-1.5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Members Snapshot
          </h3>
          {isLoading ? (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ) : (
            <MembersPreview initialMembers={members.slice(0, 16)} />
          )}
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent Activity
          </h3>
          {isLoading ? (
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-3">
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
}
