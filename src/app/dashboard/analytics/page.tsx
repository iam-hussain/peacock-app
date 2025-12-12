"use client";

import { useQuery } from "@tanstack/react-query";
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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardGraphs } from "@/lib/query-options";
import { formatIndianNumber } from "@/lib/utils";

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
        if (!summaries.length) return null;

        const labels = summaries.map((s: any) =>
            format(new Date(s.monthStartDate), "MMM yyyy")
        );

        const datasets = METRICS.filter((m) => visibleMetrics.has(m.key)).map(
            (metric) => ({
                label: metric.label,
                data: summaries.map((s: any) => s[metric.key] || 0),
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
    }, [summaries, visibleMetrics]);

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
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2 sticky left-0 bg-card">
                                            Month
                                        </th>
                                        <th className="text-right p-2">Total Deposits</th>
                                        <th className="text-right p-2">Member Balance</th>
                                        <th className="text-right p-2">Profit Withdrawals</th>
                                        <th className="text-right p-2">Member Adjustments</th>
                                        <th className="text-right p-2">Current Loan Taken</th>
                                        <th className="text-right p-2">Total Interest Collected</th>
                                        <th className="text-right p-2">Interest Balance</th>
                                        <th className="text-right p-2">Vendor Investment</th>
                                        <th className="text-right p-2">Vendor Profit</th>
                                        <th className="text-right p-2">Pending Amounts</th>
                                        <th className="text-right p-2">Available Cash</th>
                                        <th className="text-right p-2">Current Value</th>
                                        <th className="text-right p-2">Total Portfolio Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaries
                                        .slice(-12)
                                        .reverse()
                                        .map((summary: any) => (
                                            <tr
                                                key={summary.id}
                                                className="border-b hover:bg-muted/50"
                                            >
                                                <td className="p-2 sticky left-0 bg-card">
                                                    {format(new Date(summary.monthStartDate), "MMM yyyy")}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(summary.totalDeposits || 0)}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(summary.memberBalance || 0)}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(summary.profitWithdrawals || 0)}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(summary.memberAdjustments || 0)}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(summary.currentLoanTaken || 0)}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(
                                                        summary.totalInterestCollected || 0
                                                    )}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(summary.interestBalance || 0)}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(summary.vendorInvestment || 0)}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(summary.vendorProfit || 0)}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(summary.pendingAmounts || 0)}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(summary.availableCash || 0)}
                                                </td>
                                                <td className="text-right p-2">
                                                    {formatIndianNumber(summary.currentValue || 0)}
                                                </td>
                                                <td className="text-right p-2 font-medium">
                                                    {formatIndianNumber(summary.totalPortfolioValue || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
