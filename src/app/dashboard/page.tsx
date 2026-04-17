"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowDownCircle,
  Banknote,
  Briefcase,
  CalendarDays,
  Camera,
  CircleDollarSign,
  Clock,
  Crown,
  FileText,
  HandCoins,
  Hourglass,
  Info,
  Layers,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

// Dynamically import heavy components
const ActivityFeed = dynamic(
  () =>
    import("@/components/molecules/activity-feed").then(
      (mod) => mod.ActivityFeed
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 flex items-center justify-center text-muted-foreground">
        Loading activity...
      </div>
    ),
  }
);

const MembersPreview = dynamic(
  () =>
    import("@/components/molecules/members-preview").then(
      (mod) => mod.MembersPreview
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        Loading members...
      </div>
    ),
  }
);

import { ModernStatCard } from "@/components/molecules/modern-stat-card";
import PageTransition from "@/components/molecules/page-transition";
import { ScreenshotArea } from "@/components/molecules/screenshot-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchDashboardClubPassbook,
  fetchDashboardSummary,
  fetchMembers,
} from "@/lib/query-options";
import { exportScreenshot } from "@/lib/ui/export-screenshot";

/**
 * Tooltip copy for every dashboard tile. Each entry explains the
 * underlying formula in plain words so members can understand exactly
 * what a number represents — shown via click-triggered popover that
 * works on desktop hover/click and mobile tap.
 */
const TILE_TOOLTIPS: Record<string, React.ReactNode> = {
  activeMembers: "Count of members currently marked active in the club.",
  clubAge:
    "Number of months since the club started (config-defined start date).",
  memberDeposits:
    "Sum of periodic deposits actually paid by active members (from every PERIODIC_DEPOSIT transaction).",
  totalDeposits:
    "Expected total = active members × per-member expected deposit (from stage configuration).",
  memberAdjustments:
    "Sum of every offset deposit received (joining + delay adjustments members have paid in).",
  memberPending: (
    <>
      For each active member:{" "}
      <em>expected deposits + offsets − actual contributions</em>. Summed across
      active members. Positive = members still owe this amount.
    </>
  ),
  adjustmentsPending:
    "Total expected joining + delay offsets for active members, minus offsets already received.",
  totalLoanGiven:
    "Lifetime principal disbursed across all LOAN_TAKEN transactions.",
  totalInterestCollected:
    "Lifetime interest actually received across all LOAN_INTEREST transactions.",
  currentLoanTaken:
    "Principal currently outstanding (LOAN_TAKEN − LOAN_REPAY across all members).",
  interestPending:
    "Time-based expected interest on outstanding loans, minus interest already collected. Clamped at 0.",
  vendorInvestment:
    "Money currently parked with vendors = vendor investments − (vendor returns − booked profit).",
  vendorProfit: (
    <>
      Sum across vendors: for <strong>inactive</strong> vendors count the full
      P&amp;L (returns − invested, losses included); for <strong>active</strong>{" "}
      vendors count only positive gains (floored at 0).
    </>
  ),
  currentProfit:
    "Vendor Profit + Total Interest Collected. Total earnings booked by the club.",
  profitWithdrawals:
    "Sum of the profit portion of every WITHDRAW transaction (excess over a member's principal).",
  totalInvested: "Current Loan Taken + Vendor Investment.",
  totalPending: "Member Pending + Interest Pending.",
  availableCash:
    "Cash physically held by the club right now. Accumulator: +deposits, +loan repayments, +interest, +vendor returns; −withdrawals, −loans disbursed, −vendor investments.",
  currentValue: (
    <>
      <strong>Available Cash + Current Loan Taken + Vendor Investment.</strong>
      <br />
      The club&apos;s real-world worth now: cash on hand plus money out as loans
      and with vendors (both coming back).
    </>
  ),
  totalPortfolioValue: (
    <>
      <strong>Current Value + Interest Pending + Member Pending.</strong>
      <br />
      What the pot will be worth once every pending inflow lands.
    </>
  ),
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [dataSource, setDataSource] = useState<"summary" | "club-passbook">(
    "club-passbook"
  );
  const [capturedAt, setCapturedAt] = useState<Date | undefined>(undefined);

  // Month filter can be added later - for now use latest
  const selectedMonth: string | undefined = undefined;

  // Fetch club passbook data
  const {
    data: clubPassbookData,
    isLoading: isClubPassbookLoading,
    error: clubPassbookError,
    refetch: refetchClubPassbook,
  } = useQuery(fetchDashboardClubPassbook());

  // Fetch dashboard summary with refetch capability
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery(fetchDashboardSummary(selectedMonth));

  // Handle data source toggle with cache invalidation and immediate refetch
  const handleDataSourceChange = (newSource: "summary" | "club-passbook") => {
    setDataSource(newSource);
    // Invalidate and refetch to ensure fresh data when switching
    if (newSource === "summary") {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
      refetchSummary();
    } else {
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "club-passbook"],
      });
      refetchClubPassbook();
    }
  };

  // Fetch members separately (not part of Summary)
  const { data: membersData, isLoading: isMembersLoading } =
    useQuery(fetchMembers());

  // Memoize data source selection
  const data = useMemo(
    () =>
      dataSource === "summary"
        ? summaryData?.success
          ? summaryData?.data
          : undefined
        : clubPassbookData?.success
          ? clubPassbookData?.data
          : undefined,
    [dataSource, summaryData, clubPassbookData]
  );

  // Memoize loading state
  const isLoading = useMemo(
    () =>
      dataSource === "summary"
        ? isSummaryLoading || isMembersLoading
        : isClubPassbookLoading || isMembersLoading,
    [dataSource, isSummaryLoading, isMembersLoading, isClubPassbookLoading]
  );

  // Memoize members data
  const members = useMemo(
    () => membersData?.members || [],
    [membersData?.members]
  );

  // Log errors for debugging
  if (dataSource === "summary") {
    if (summaryError || (summaryData && !summaryData.success)) {
      console.error(
        "Dashboard summary error:",
        summaryError || summaryData?.error
      );
    }
  } else {
    if (clubPassbookError || (clubPassbookData && !clubPassbookData.success)) {
      console.error(
        "Club passbook error:",
        clubPassbookError || clubPassbookData?.error
      );
    }
  }

  // Memoize currency formatter
  const formatCurrency = useMemo(
    () => (value: number) =>
      (value || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    []
  );

  const handleScreenshot = async () => {
    try {
      // Set captured timestamp right before export
      const now = new Date();
      setCapturedAt(now);

      // Wait a tick to ensure the timestamp is rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const filename = `peacock-club-dashboard-${dataSource}-${format(new Date(), "yyyy-MM-dd-HHmmss")}`;
      await exportScreenshot(filename, {
        pixelRatio: 2,
        quality: 1.0,
      });
    } catch (error) {
      console.error("Error capturing screenshot:", error);
    }
  };

  return (
    <PageTransition>
      <div className="w-full max-w-7xl mx-auto space-y-3 px-2 sm:px-0">
        {/* Page Header */}
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Overview of your financial club management
              </p>
            </div>
            {/* Data Source Toggle & Screenshot */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={dataSource === "summary" ? "default" : "outline"}
                size="sm"
                onClick={() => handleDataSourceChange("summary")}
                className="flex-1 sm:flex-initial"
              >
                Summary
              </Button>
              <Button
                variant={dataSource === "club-passbook" ? "default" : "outline"}
                size="sm"
                onClick={() => handleDataSourceChange("club-passbook")}
                className="flex-1 sm:flex-initial"
              >
                <span className="hidden sm:inline">Club Passbook</span>
                <span className="sm:hidden">Passbook</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleScreenshot}
                className="gap-2 flex-1 sm:flex-initial"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Screenshot</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Financial Summary Sections */}
        <div className="space-y-3">
          {/* CLUB SNAPSHOT */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Club Snapshot
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <ModernStatCard
                title="Active Members"
                tooltip={TILE_TOOLTIPS.activeMembers}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    data?.members?.activeMembers || 0
                  )
                }
                icon={<Users className="h-5 w-5" />}
                iconBgColor="#E3F2FD"
              />
              <ModernStatCard
                title="Club Age"
                tooltip={TILE_TOOLTIPS.clubAge}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    `${data?.members?.clubAgeMonths || 0} months`
                  )
                }
                icon={<CalendarDays className="h-5 w-5" />}
                iconBgColor="#EDE7F6"
              />
            </div>
          </div>

          {/* MEMBER FUNDS */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Member Funds
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <ModernStatCard
                title="Member Deposits"
                tooltip={TILE_TOOLTIPS.memberDeposits}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.memberFunds?.memberDepositsPaid || 0)
                  )
                }
                icon={<CircleDollarSign className="h-5 w-5" />}
                iconBgColor="#E8F5E9"
              />
              <ModernStatCard
                title="Member Adjustments"
                tooltip={TILE_TOOLTIPS.memberAdjustments}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.memberOutflow?.memberAdjustments || 0)
                  )
                }
                icon={<SlidersHorizontal className="h-5 w-5" />}
                iconBgColor="#F3E5F5"
              />
            </div>
          </div>

          {/* MEMBER PENDING */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Member Pending
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <ModernStatCard
                title="Member Pending"
                tooltip={TILE_TOOLTIPS.memberPending}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.memberFunds?.totalMemberPending || 0)
                  )
                }
                icon={<Wallet className="h-5 w-5" />}
                iconBgColor="#FFF3E0"
              />
              <ModernStatCard
                title="Adjustments Pending"
                tooltip={TILE_TOOLTIPS.adjustmentsPending}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.memberOutflow?.pendingAdjustments || 0)
                  )
                }
                icon={<Hourglass className="h-5 w-5" />}
                iconBgColor="#FBE9E7"
              />
            </div>
          </div>

          {/* LOANS – LIFETIME */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Loans – Lifetime
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <ModernStatCard
                title="Total Loan Given"
                tooltip={TILE_TOOLTIPS.totalLoanGiven}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.loans?.lifetime?.totalLoanGiven || 0)
                  )
                }
                icon={<HandCoins className="h-5 w-5" />}
                iconBgColor="#2563EB"
              />
              <ModernStatCard
                title="Total Interest Collected"
                tooltip={TILE_TOOLTIPS.totalInterestCollected}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(
                      data?.loans?.lifetime?.totalInterestCollected || 0
                    )
                  )
                }
                icon={<TrendingUp className="h-5 w-5" />}
                iconBgColor="#16A34A"
              />
            </div>
          </div>

          {/* LOANS – ACTIVE */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Loans – Active
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <ModernStatCard
                title="Current Loan Taken"
                tooltip={TILE_TOOLTIPS.currentLoanTaken}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(
                      data?.loans?.outstanding?.currentLoanTaken || 0
                    )
                  )
                }
                icon={<FileText className="h-5 w-5" />}
                iconBgColor="#F59E0B"
              />
              <ModernStatCard
                title="Interest Pending"
                tooltip={TILE_TOOLTIPS.interestPending}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(
                      data?.loans?.outstanding?.interestBalance || 0
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
                tooltip={TILE_TOOLTIPS.vendorInvestment}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.vendor?.vendorInvestment || 0)
                  )
                }
                icon={<Briefcase className="h-5 w-5" />}
                iconBgColor="#E3F2FD"
              />
              <ModernStatCard
                title="Vendor Profit"
                tooltip={TILE_TOOLTIPS.vendorProfit}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.vendor?.vendorProfit || 0)
                  )
                }
                icon={<TrendingUp className="h-5 w-5" />}
                iconBgColor="#E8F5E9"
              />
            </div>
          </div>

          {/* PROFIT SUMMARY */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Profit Summary
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <ModernStatCard
                title="Current Profit"
                tooltip={TILE_TOOLTIPS.currentProfit}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.cashFlow?.totalProfit || 0)
                  )
                }
                icon={<TrendingUp className="h-5 w-5" />}
                iconBgColor="#16A34A"
              />
              <ModernStatCard
                title="Profit Withdrawals"
                tooltip={TILE_TOOLTIPS.profitWithdrawals}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.memberOutflow?.profitWithdrawals || 0)
                  )
                }
                icon={<ArrowDownCircle className="h-5 w-5" />}
                iconBgColor="#FBE9E7"
              />
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
                tooltip={TILE_TOOLTIPS.totalInvested}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.cashFlow?.totalInvested || 0)
                  )
                }
                icon={<Layers className="h-5 w-5" />}
                iconBgColor="#2563EB"
              />
              <ModernStatCard
                title="Total Pending"
                tooltip={TILE_TOOLTIPS.totalPending}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.cashFlow?.pendingAmounts || 0)
                  )
                }
                icon={<Clock className="h-5 w-5" />}
                iconBgColor="#9333EA"
              />
            </div>
          </div>

          {/* VALUATION & LIQUIDITY */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Valuation & Liquidity
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <ModernStatCard
                title="Available Cash"
                tooltip={TILE_TOOLTIPS.availableCash}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.valuation?.availableCash || 0)
                  )
                }
                icon={<Wallet className="h-5 w-5" />}
                iconBgColor="#F59E0B"
              />
              <ModernStatCard
                title="Current Value"
                tooltip={TILE_TOOLTIPS.currentValue}
                value={
                  isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    formatCurrency(data?.valuation?.currentValue || 0)
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
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Total Portfolio Value
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label="What is Total Portfolio Value?"
                            className="shrink-0 rounded-full p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <Info className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          side="top"
                          align="start"
                          className="w-64 text-xs leading-relaxed"
                        >
                          <p className="font-semibold text-foreground normal-case tracking-normal mb-1">
                            Total Portfolio Value
                          </p>
                          <div className="text-muted-foreground normal-case tracking-normal">
                            {TILE_TOOLTIPS.totalPortfolioValue}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  {/* Center: Value */}
                  <div className="flex-1 text-center">
                    {isLoading ? (
                      <Skeleton className="h-10 w-48 mx-auto" />
                    ) : (
                      <p className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                        {formatCurrency(
                          data?.portfolio?.totalPortfolioValue || 0
                        )}
                      </p>
                    )}
                    <p className="mt-2 hidden text-xs text-muted-foreground md:block">
                      Current Value + Pending Loan Interest + Pending Member
                      Deposits
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

        {/* Screenshot Area - Hidden, used for export */}
        <ScreenshotArea
          title="Dashboard"
          capturedAt={capturedAt}
          identifier={
            dataSource === "club-passbook"
              ? "Club Passbook View"
              : "Summary View"
          }
        >
          <div className="space-y-3 bg-paper p-6">
            {/* CLUB SNAPSHOT */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Club Snapshot
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <ModernStatCard
                  title="Active Members"
                  tooltip={TILE_TOOLTIPS.activeMembers}
                  value={data?.members?.activeMembers || 0}
                  icon={<Users className="h-5 w-5" />}
                  iconBgColor="#E3F2FD"
                />
                <ModernStatCard
                  title="Club Age"
                  tooltip={TILE_TOOLTIPS.clubAge}
                  value={`${data?.members?.clubAgeMonths || 0} months`}
                  icon={<CalendarDays className="h-5 w-5" />}
                  iconBgColor="#EDE7F6"
                />
              </div>
            </div>

            {/* MEMBER FUNDS */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Member Funds
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <ModernStatCard
                  title="Total Deposits"
                  tooltip={TILE_TOOLTIPS.totalDeposits}
                  value={formatCurrency(data?.memberFunds?.totalDeposits || 0)}
                  icon={<CircleDollarSign className="h-5 w-5" />}
                  iconBgColor="#E8F5E9"
                />
                <ModernStatCard
                  title="Member Adjustments"
                  tooltip={TILE_TOOLTIPS.memberAdjustments}
                  value={formatCurrency(
                    data?.memberOutflow?.memberAdjustments || 0
                  )}
                  icon={<SlidersHorizontal className="h-5 w-5" />}
                  iconBgColor="#F3E5F5"
                />
              </div>
            </div>

            {/* MEMBER PENDING */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Member Pending
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <ModernStatCard
                  title="Member Pending"
                  tooltip={TILE_TOOLTIPS.memberPending}
                  value={formatCurrency(
                    data?.memberFunds?.totalMemberPending || 0
                  )}
                  icon={<Wallet className="h-5 w-5" />}
                  iconBgColor="#FFF3E0"
                />
                <ModernStatCard
                  title="Adjustments Pending"
                  tooltip={TILE_TOOLTIPS.adjustmentsPending}
                  value={formatCurrency(
                    data?.memberOutflow?.pendingAdjustments || 0
                  )}
                  icon={<Hourglass className="h-5 w-5" />}
                  iconBgColor="#FBE9E7"
                />
              </div>
            </div>

            {/* LOANS – LIFETIME */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Loans – Lifetime
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <ModernStatCard
                  title="Total Loan Given"
                  tooltip={TILE_TOOLTIPS.totalLoanGiven}
                  value={formatCurrency(
                    data?.loans?.lifetime?.totalLoanGiven || 0
                  )}
                  icon={<HandCoins className="h-5 w-5" />}
                  iconBgColor="#2563EB"
                />
                <ModernStatCard
                  title="Total Interest Collected"
                  tooltip={TILE_TOOLTIPS.totalInterestCollected}
                  value={formatCurrency(
                    data?.loans?.lifetime?.totalInterestCollected || 0
                  )}
                  icon={<TrendingUp className="h-5 w-5" />}
                  iconBgColor="#16A34A"
                />
              </div>
            </div>

            {/* LOANS – ACTIVE */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Loans – Active
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <ModernStatCard
                  title="Current Loan Taken"
                  tooltip={TILE_TOOLTIPS.currentLoanTaken}
                  value={formatCurrency(
                    data?.loans?.outstanding?.currentLoanTaken || 0
                  )}
                  icon={<FileText className="h-5 w-5" />}
                  iconBgColor="#F59E0B"
                />
                <ModernStatCard
                  title="Interest Pending"
                  tooltip={TILE_TOOLTIPS.interestPending}
                  value={formatCurrency(
                    data?.loans?.outstanding?.interestBalance || 0
                  )}
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
                  tooltip={TILE_TOOLTIPS.vendorInvestment}
                  value={formatCurrency(data?.vendor?.vendorInvestment || 0)}
                  icon={<Briefcase className="h-5 w-5" />}
                  iconBgColor="#E3F2FD"
                />
                <ModernStatCard
                  title="Vendor Profit"
                  tooltip={TILE_TOOLTIPS.vendorProfit}
                  value={formatCurrency(data?.vendor?.vendorProfit || 0)}
                  icon={<TrendingUp className="h-5 w-5" />}
                  iconBgColor="#E8F5E9"
                />
              </div>
            </div>

            {/* PROFIT SUMMARY */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Profit Summary
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <ModernStatCard
                  title="Current Profit"
                  tooltip={TILE_TOOLTIPS.currentProfit}
                  value={formatCurrency(data?.cashFlow?.totalProfit || 0)}
                  icon={<TrendingUp className="h-5 w-5" />}
                  iconBgColor="#16A34A"
                />
                <ModernStatCard
                  title="Profit Withdrawals"
                  tooltip={TILE_TOOLTIPS.profitWithdrawals}
                  value={formatCurrency(
                    data?.memberOutflow?.profitWithdrawals || 0
                  )}
                  icon={<ArrowDownCircle className="h-5 w-5" />}
                  iconBgColor="#FBE9E7"
                />
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
                  tooltip={TILE_TOOLTIPS.totalInvested}
                  value={formatCurrency(data?.cashFlow?.totalInvested || 0)}
                  icon={<Layers className="h-5 w-5" />}
                  iconBgColor="#2563EB"
                />
                <ModernStatCard
                  title="Total Pending"
                  tooltip={TILE_TOOLTIPS.totalPending}
                  value={formatCurrency(data?.cashFlow?.pendingAmounts || 0)}
                  icon={<Clock className="h-5 w-5" />}
                  iconBgColor="#9333EA"
                />
              </div>
            </div>

            {/* VALUATION & LIQUIDITY */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Valuation & Liquidity
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <ModernStatCard
                  title="Available Cash"
                  tooltip={TILE_TOOLTIPS.availableCash}
                  value={formatCurrency(data?.valuation?.availableCash || 0)}
                  icon={<Wallet className="h-5 w-5" />}
                  iconBgColor="#F59E0B"
                />
                <ModernStatCard
                  title="Current Value"
                  tooltip={TILE_TOOLTIPS.currentValue}
                  value={formatCurrency(data?.valuation?.currentValue || 0)}
                  icon={<Banknote className="h-5 w-5" />}
                  iconBgColor="#16A34A"
                />
              </div>
            </div>

            {/* PORTFOLIO SUMMARY */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Portfolio Summary
              </h3>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Card className="col-span-1 md:col-span-2 h-full flex flex-col rounded-lg border-2 border-primary/30 bg-card shadow-lg ring-2 ring-primary/10">
                  <CardContent className="flex flex-1 flex-col p-4 md:p-5">
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Total Portfolio Value
                        </p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                          {formatCurrency(
                            data?.portfolio?.totalPortfolioValue || 0
                          )}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Total portfolio value (cash + investments +
                          receivables)
                        </p>
                      </div>
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
          </div>
        </ScreenshotArea>

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
    </PageTransition>
  );
}
