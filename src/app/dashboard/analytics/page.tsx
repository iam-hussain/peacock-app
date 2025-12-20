"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { format, startOfMonth, subMonths } from "date-fns";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

// Register Chart.js components (only once)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

// Dynamically import heavy chart component
const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] flex items-center justify-center text-muted-foreground">
      Loading chart...
    </div>
  ),
});

import { DataTable } from "@/components/atoms/data-table";
import { CommonTableCell } from "@/components/atoms/table-component";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardGraphs } from "@/lib/query-options";
import { formatIndianNumber } from "@/lib/ui/utils";

const TIME_RANGES = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "ALL", months: null },
] as const;

const METRICS = [
  // Club Snapshot
  { key: "activeMembers", label: "Active Members", color: "rgb(59, 130, 246)" },
  { key: "clubAgeMonths", label: "Club Age", color: "rgb(168, 85, 247)" },
  // Member Funds
  { key: "totalDeposits", label: "Member Deposits", color: "rgb(34, 197, 94)" },
  {
    key: "memberAdjustments",
    label: "Member Adjustments",
    color: "rgb(168, 85, 247)",
  },
  // Member Pending
  { key: "memberPending", label: "Member Pending", color: "rgb(251, 146, 60)" },
  {
    key: "adjustmentsPending",
    label: "Adjustments Pending",
    color: "rgb(239, 68, 68)",
  },
  // Loans – Lifetime
  {
    key: "totalLoanGiven",
    label: "Total Loan Given",
    color: "rgb(59, 130, 246)",
  },
  {
    key: "totalInterestCollected",
    label: "Total Interest Collected",
    color: "rgb(34, 197, 94)",
  },
  // Loans – Active
  {
    key: "currentLoanTaken",
    label: "Current Loan Taken",
    color: "rgb(239, 68, 68)",
  },
  {
    key: "interestPending",
    label: "Interest Pending",
    color: "rgb(251, 146, 60)",
  },
  // Vendor Transactions
  {
    key: "vendorInvestment",
    label: "Vendor Investment",
    color: "rgb(14, 165, 233)",
  },
  { key: "vendorProfit", label: "Vendor Profit", color: "rgb(20, 184, 166)" },
  // Profit Summary
  { key: "currentProfit", label: "Current Profit", color: "rgb(20, 184, 166)" },
  {
    key: "profitWithdrawals",
    label: "Profit Withdrawals",
    color: "rgb(234, 179, 8)",
  },
  // Cash Flow Position
  { key: "totalInvested", label: "Total Invested", color: "rgb(59, 130, 246)" },
  {
    key: "totalPending",
    label: "Total Pending",
    color: "rgb(245, 158, 11)",
  },
  // Valuation & Liquidity
  { key: "availableCash", label: "Available Cash", color: "rgb(34, 197, 94)" },
  { key: "currentValue", label: "Current Value", color: "rgb(16, 185, 129)" },
  // Portfolio Summary
  {
    key: "totalPortfolioValue",
    label: "Total Portfolio Value",
    color: "rgb(139, 92, 246)",
  },
] as const;

type MonthlySummary = {
  monthStartDate: string;
  // Club Snapshot
  activeMembers: number;
  clubAgeMonths: number;
  // Member Funds
  totalDeposits: number;
  memberAdjustments: number;
  // Member Pending
  memberPending: number;
  adjustmentsPending: number;
  // Loans – Lifetime
  totalLoanGiven: number;
  totalInterestCollected: number;
  // Loans – Active
  currentLoanTaken: number;
  interestPending: number;
  // Vendor Transactions
  vendorInvestment: number;
  vendorProfit: number;
  // Profit Summary
  currentProfit: number;
  profitWithdrawals: number;
  // Cash Flow Position
  totalInvested: number;
  totalPending: number;
  // Valuation & Liquidity
  availableCash: number;
  currentValue: number;
  // Portfolio Summary
  totalPortfolioValue: number;
};

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState<string>("1Y");
  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set([
      "availableCash",
      "currentValue",
      "totalPortfolioValue",
      "totalDeposits",
      "totalInvested",
    ])
  );

  // Calculate date range
  const { fromDate, toDate } = useMemo(() => {
    const to = startOfMonth(new Date());
    const range = TIME_RANGES.find((r) => r.label === selectedRange);
    const from = range?.months
      ? startOfMonth(subMonths(to, range.months - 1))
      : null; // ALL time - will need to get first transaction date

    return {
      fromDate: from ? format(from, "yyyy-MM") : null,
      toDate: format(to, "yyyy-MM"),
    };
  }, [selectedRange]);

  // Fetch graph data
  const { data, isLoading } = useQuery(
    fetchDashboardGraphs(
      fromDate || "2020-09", // Fallback to club start
      toDate
    )
  );

  const summaries = data?.summaries || [];

  // Extract nested data for chart and table
  const flatSummaries: MonthlySummary[] = summaries
    .map((s: any) => ({
      monthStartDate: s.systemMeta?.monthStartDate,
      // Club Snapshot
      activeMembers: s.members?.activeMembers || 0,
      clubAgeMonths: s.members?.clubAgeMonths || 0,
      // Member Funds
      totalDeposits: s.memberFunds?.totalDeposits || 0,
      memberAdjustments: s.memberOutflow?.memberAdjustments || 0,
      // Member Pending
      memberPending: s.memberFunds?.memberBalance || 0,
      adjustmentsPending: s.memberOutflow?.pendingAdjustments || 0,
      // Loans – Lifetime
      totalLoanGiven: s.loans?.lifetime?.totalLoanGiven || 0,
      totalInterestCollected: s.loans?.lifetime?.totalInterestCollected || 0,
      // Loans – Active
      currentLoanTaken: s.loans?.outstanding?.currentLoanTaken || 0,
      interestPending: s.loans?.outstanding?.interestBalance || 0,
      // Vendor Transactions
      vendorInvestment: s.vendor?.vendorInvestment || 0,
      vendorProfit: s.vendor?.vendorProfit || 0,
      // Profit Summary
      currentProfit: s.cashFlow?.totalProfit || 0,
      profitWithdrawals: s.memberOutflow?.profitWithdrawals || 0,
      // Cash Flow Position
      totalInvested: s.cashFlow?.totalInvested || 0,
      totalPending: s.cashFlow?.pendingAmounts || 0,
      // Valuation & Liquidity
      availableCash: s.valuation?.availableCash || 0,
      currentValue: s.valuation?.currentValue || 0,
      // Portfolio Summary
      totalPortfolioValue: s.portfolio?.totalPortfolioValue || 0,
    }))
    .filter((s) => s.monthStartDate); // Filter out entries with invalid dates

  // Define table columns
  const columns: ColumnDef<MonthlySummary>[] = useMemo(
    () => [
      {
        id: "month",
        accessorKey: "monthStartDate",
        header: "Month",
        enableSorting: true,
        meta: { tooltip: "Month and year of the summary" },
        cell: ({ row }) => {
          const date = new Date(row.original.monthStartDate);
          if (isNaN(date.getTime())) {
            return <CommonTableCell label="Invalid Date" />;
          }
          return <CommonTableCell label={format(date, "MMM yyyy")} />;
        },
      },
      // Club Snapshot
      {
        id: "activeMembers",
        accessorKey: "activeMembers",
        header: "Active Members",
        enableSorting: true,
        meta: { align: "right", tooltip: "Number of active members" },
        cell: ({ row }) => (
          <CommonTableCell
            label={String(row.original.activeMembers || 0)}
            className="text-right"
          />
        ),
      },
      {
        id: "clubAgeMonths",
        accessorKey: "clubAgeMonths",
        header: "Club Age",
        enableSorting: true,
        meta: { align: "right", tooltip: "Club age in months" },
        cell: ({ row }) => (
          <CommonTableCell
            label={`${row.original.clubAgeMonths || 0} months`}
            className="text-right"
          />
        ),
      },
      // Member Funds
      {
        id: "totalDeposits",
        accessorKey: "totalDeposits",
        header: "Member Deposits",
        enableSorting: true,
        meta: { align: "right", tooltip: "Total deposits from all members" },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.totalDeposits || 0)}
            className="text-right"
          />
        ),
      },
      {
        id: "memberAdjustments",
        accessorKey: "memberAdjustments",
        header: "Member Adjustments",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Manual adjustments made to member accounts",
        },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.memberAdjustments || 0)}
            className="text-right"
          />
        ),
      },
      // Member Pending
      {
        id: "memberPending",
        accessorKey: "memberPending",
        header: "Member Pending",
        enableSorting: true,
        meta: { align: "right", tooltip: "Total pending balance from members" },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.memberPending || 0)}
            className="text-right"
          />
        ),
      },
      {
        id: "adjustmentsPending",
        accessorKey: "adjustmentsPending",
        header: "Adjustments Pending",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Pending adjustments not yet received",
        },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.adjustmentsPending || 0)}
            className="text-right"
          />
        ),
      },
      // Loans – Lifetime
      {
        id: "totalLoanGiven",
        accessorKey: "totalLoanGiven",
        header: "Total Loan Given",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total amount of loans given to members",
        },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.totalLoanGiven || 0)}
            className="text-right"
          />
        ),
      },
      {
        id: "totalInterestCollected",
        accessorKey: "totalInterestCollected",
        header: "Total Interest Collected",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total interest collected from loans",
        },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.totalInterestCollected || 0)}
            className="text-right"
          />
        ),
      },
      // Loans – Active
      {
        id: "currentLoanTaken",
        accessorKey: "currentLoanTaken",
        header: "Current Loan Taken",
        enableSorting: true,
        meta: { align: "right", tooltip: "Outstanding loan amount" },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.currentLoanTaken || 0)}
            className="text-right"
          />
        ),
      },
      {
        id: "interestPending",
        accessorKey: "interestPending",
        header: "Interest Pending",
        enableSorting: true,
        meta: { align: "right", tooltip: "Outstanding interest amount" },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.interestPending || 0)}
            className="text-right"
          />
        ),
      },
      // Vendor Transactions
      {
        id: "vendorInvestment",
        accessorKey: "vendorInvestment",
        header: "Vendor Investment",
        enableSorting: true,
        meta: { align: "right", tooltip: "Total amount invested with vendors" },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.vendorInvestment || 0)}
            className="text-right"
          />
        ),
      },
      {
        id: "vendorProfit",
        accessorKey: "vendorProfit",
        header: "Vendor Profit",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Profit earned from vendor investments",
        },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.vendorProfit || 0)}
            className="text-right"
          />
        ),
      },
      // Profit Summary
      {
        id: "currentProfit",
        accessorKey: "currentProfit",
        header: "Current Profit",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Current profit from vendor investments",
        },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.currentProfit || 0)}
            className="text-right"
          />
        ),
      },
      {
        id: "profitWithdrawals",
        accessorKey: "profitWithdrawals",
        header: "Profit Withdrawals",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total profit withdrawals by members",
        },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.profitWithdrawals || 0)}
            className="text-right"
          />
        ),
      },
      // Cash Flow Position
      {
        id: "totalInvested",
        accessorKey: "totalInvested",
        header: "Total Invested",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total amount invested (loans + vendor investments)",
        },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.totalInvested || 0)}
            className="text-right"
          />
        ),
      },
      {
        id: "totalPending",
        accessorKey: "totalPending",
        header: "Total Pending",
        enableSorting: true,
        meta: { align: "right", tooltip: "Total amounts pending collection" },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.totalPending || 0)}
            className="text-right"
          />
        ),
      },
      // Valuation & Liquidity
      {
        id: "availableCash",
        accessorKey: "availableCash",
        header: "Available Cash",
        enableSorting: true,
        meta: { align: "right", tooltip: "Cash available in club account" },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.availableCash || 0)}
            className="text-right"
          />
        ),
      },
      {
        id: "currentValue",
        accessorKey: "currentValue",
        header: "Current Value",
        enableSorting: true,
        meta: { align: "right", tooltip: "Current value of club assets" },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.currentValue || 0)}
            className="text-right"
          />
        ),
      },
      // Portfolio Summary
      {
        id: "totalPortfolioValue",
        accessorKey: "totalPortfolioValue",
        header: "Total Portfolio Value",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total portfolio value including all assets",
        },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.totalPortfolioValue || 0)}
            className="text-right font-medium"
          />
        ),
      },
    ],
    []
  );

  // Toggle metric visibility
  const toggleMetric = (key: string) => {
    const newSet = new Set(visibleMetrics);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setVisibleMetrics(newSet);
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!flatSummaries.length) return null;

    const labels = flatSummaries.map((s: any) => {
      const date = new Date(s.monthStartDate);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return format(date, "MMM yyyy");
    });

    const datasets = METRICS.filter((m) => visibleMetrics.has(m.key)).map(
      (metric) => ({
        label: metric.label,
        data: flatSummaries.map((s: any) => s[metric.key] || 0),
        borderColor: metric.color,
        backgroundColor: `${metric.color}20`,
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      })
    );

    return { labels, datasets };
  }, [flatSummaries, visibleMetrics]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        onClick: (e: any, legendItem: any) => {
          const datasetIndex = legendItem.datasetIndex;
          const visibleMetricsArray = METRICS.filter((m) =>
            visibleMetrics.has(m.key)
          );
          const metric = visibleMetricsArray[datasetIndex];
          if (metric) {
            toggleMetric(metric.key);
          }
        },
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${formatIndianNumber(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: (value: any) => `${formatIndianNumber(value)}`,
        },
      },
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cash flow graphs and financial metrics over time
        </p>
        {summaries.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Note: Data is based on monthly snapshots. If values don&apos;t match
            the dashboard, please run recalculation from Settings.
          </p>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Time Range:
              </span>
              <div className="flex gap-2">
                {TIME_RANGES.map((range) => (
                  <Button
                    key={range.label}
                    variant={
                      selectedRange === range.label ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedRange(range.label)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Metric Toggles */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-foreground">
                Metrics:
              </span>
              <div className="flex flex-wrap gap-2">
                {METRICS.map((metric) => (
                  <Button
                    key={metric.key}
                    variant={
                      visibleMetrics.has(metric.key) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleMetric(metric.key)}
                    className="text-xs"
                  >
                    {metric.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Metrics Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[500px] w-full" />
          ) : chartData ? (
            <div className="h-[500px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground">
              No data available for the selected range
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table Summary */}
      {!isLoading && summaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={flatSummaries.reverse()}
              frozenColumnKey="month"
              isLoading={isLoading}
              pageSize={10}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
