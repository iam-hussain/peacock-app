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
import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";

import { DataTable } from "@/components/atoms/data-table";
import { CommonTableCell } from "@/components/atoms/table-component";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardGraphs } from "@/lib/query-options";
import { formatIndianNumber } from "@/lib/ui/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const TIME_RANGES = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "ALL", months: null },
] as const;

const METRICS = [
  { key: "totalDeposits", label: "Total Deposits", color: "rgb(34, 197, 94)" },
  { key: "memberBalance", label: "Member Balance", color: "rgb(59, 130, 246)" },
  {
    key: "profitWithdrawals",
    label: "Profit Withdrawals",
    color: "rgb(234, 179, 8)",
  },
  {
    key: "memberAdjustments",
    label: "Member Adjustments",
    color: "rgb(168, 85, 247)",
  },
  {
    key: "currentLoanTaken",
    label: "Current Loan Taken",
    color: "rgb(239, 68, 68)",
  },
  {
    key: "totalInterestCollected",
    label: "Total Interest Collected",
    color: "rgb(236, 72, 153)",
  },
  {
    key: "interestBalance",
    label: "Interest Balance",
    color: "rgb(251, 146, 60)",
  },
  {
    key: "vendorInvestment",
    label: "Vendor Investment",
    color: "rgb(14, 165, 233)",
  },
  { key: "vendorProfit", label: "Vendor Profit", color: "rgb(20, 184, 166)" },
  {
    key: "pendingAmounts",
    label: "Pending Amounts",
    color: "rgb(245, 158, 11)",
  },
  { key: "availableCash", label: "Available Cash", color: "rgb(34, 197, 94)" },
  { key: "currentValue", label: "Current Value", color: "rgb(16, 185, 129)" },
  {
    key: "totalPortfolioValue",
    label: "Total Portfolio Value",
    color: "rgb(139, 92, 246)",
  },
] as const;

type MonthlySummary = {
  monthStartDate: string;
  totalDeposits: number;
  memberBalance: number;
  profitWithdrawals: number;
  memberAdjustments: number;
  currentLoanTaken: number;
  totalInterestCollected: number;
  interestBalance: number;
  vendorInvestment: number;
  vendorProfit: number;
  pendingAmounts: number;
  availableCash: number;
  currentValue: number;
  totalPortfolioValue: number;
};

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState<string>("1Y");
  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(["availableCash", "currentValue", "totalPortfolioValue"])
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
  const flatSummaries: MonthlySummary[] = summaries.map((s: any) => ({
    monthStartDate: s.monthStartDate,
    totalDeposits: s.memberFunds?.totalDeposits || 0,
    memberBalance: s.memberFunds?.memberBalance || 0,
    profitWithdrawals: s.memberOutflow?.profitWithdrawals || 0,
    memberAdjustments: s.memberOutflow?.memberAdjustments || 0,
    currentLoanTaken: s.loans?.outstanding?.currentLoanTaken || 0,
    totalInterestCollected: s.loans?.lifetime?.totalInterestCollected || 0,
    interestBalance: s.loans?.outstanding?.interestBalance || 0,
    vendorInvestment: s.vendor?.vendorInvestment || 0,
    vendorProfit: s.vendor?.vendorProfit || 0,
    pendingAmounts: s.cashFlow?.pendingAmounts || 0,
    availableCash: s.valuation?.availableCash || 0,
    currentValue: s.valuation?.currentValue || 0,
    totalPortfolioValue: s.portfolio?.totalPortfolioValue || 0,
  }));

  // Define table columns
  const columns: ColumnDef<MonthlySummary>[] = useMemo(
    () => [
      {
        id: "month",
        accessorKey: "monthStartDate",
        header: "Month",
        enableSorting: true,
        meta: { tooltip: "Month and year of the summary" },
        cell: ({ row }) => (
          <CommonTableCell
            label={format(new Date(row.original.monthStartDate), "MMM yyyy")}
          />
        ),
      },
      {
        id: "totalDeposits",
        accessorKey: "totalDeposits",
        header: "Total Deposits",
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
        id: "memberBalance",
        accessorKey: "memberBalance",
        header: "Member Balance",
        enableSorting: true,
        meta: { align: "right", tooltip: "Total balance held by members" },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.memberBalance || 0)}
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
      {
        id: "interestBalance",
        accessorKey: "interestBalance",
        header: "Interest Balance",
        enableSorting: true,
        meta: { align: "right", tooltip: "Outstanding interest amount" },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.interestBalance || 0)}
            className="text-right"
          />
        ),
      },
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
      {
        id: "pendingAmounts",
        accessorKey: "pendingAmounts",
        header: "Pending Amounts",
        enableSorting: true,
        meta: { align: "right", tooltip: "Amounts pending collection" },
        cell: ({ row }) => (
          <CommonTableCell
            label={formatIndianNumber(row.original.pendingAmounts || 0)}
            className="text-right"
          />
        ),
      },
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

    const labels = flatSummaries.map((s: any) =>
      format(new Date(s.monthStartDate), "MMM yyyy")
    );

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
