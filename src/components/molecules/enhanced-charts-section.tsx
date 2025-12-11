"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { addYears, differenceInYears, format } from "date-fns";
import { useMemo, useState } from "react";
import { Doughnut, Line } from "react-chartjs-2";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { TransformedStatistics } from "@/app/api/statistics/route";
import { clubAge } from "@/lib/date";
import fetcher from "@/lib/fetcher";
import { formatIndianNumber } from "@/lib/utils";

interface MonthlyData {
  month: string;
  monthYear: string;
  available: number;
  invested: number;
  pending: number;
}

ChartJS.register(
  ArcElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

interface EnhancedChartsSectionProps {
  statistics: TransformedStatistics;
}

// Fetch monthly chart data from API
async function fetchMonthlyChartData(range: string): Promise<MonthlyData[]> {
  const response = (await fetcher.get(
    `/api/charts/monthly-data?range=${range}`
  )) as { data: MonthlyData[]; cached: boolean };
  return response.data;
}

export function EnhancedChartsSection({
  statistics,
}: EnhancedChartsSectionProps) {
  const club = clubAge();
  const [selectedRange, setSelectedRange] = useState<string>("all-time");

  // Fetch monthly chart data from API
  const { data: monthlyData, isLoading: isLoadingChartData } = useQuery({
    queryKey: ["chart-monthly-data", selectedRange],
    queryFn: () => fetchMonthlyChartData(selectedRange),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Generate year options based on club age
  const yearOptions = useMemo(() => {
    const options = [];
    const clubStartDate = new Date();
    clubStartDate.setMonth(clubStartDate.getMonth() - club.inMonth);

    const yearsSinceStart = differenceInYears(new Date(), clubStartDate);

    for (let i = 1; i <= yearsSinceStart + 1; i++) {
      const yearStart = addYears(clubStartDate, i - 1);
      const yearEnd = addYears(clubStartDate, i);
      options.push({
        value: `year-${i}`,
        label: `Year ${i} (${format(yearStart, "yyyy")})`,
        startDate: yearStart,
        endDate: yearEnd,
      });
    }

    return options;
  }, [club.inMonth]);

  // Use real monthly data from API or fallback to empty array
  const trendData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return [];
    }
    return monthlyData;
  }, [monthlyData]);

  // Cash Flow Trend - Multi-line Chart
  const cashFlowChartData = {
    labels: trendData.map((d) => d.monthYear),
    datasets: [
      {
        label: "Available Cash",
        data: trendData.map((d) => d.available),
        borderColor: "rgb(34, 197, 94)", // green-500
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: "Invested Amount",
        data: trendData.map((d) => d.invested),
        borderColor: "rgb(59, 130, 246)", // blue-500
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: "Pending Amount",
        data: trendData.map((d) => d.pending),
        borderColor: "rgb(234, 179, 8)", // yellow-500
        backgroundColor: "rgba(234, 179, 8, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  };

  const cashFlowChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          padding: 12,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
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
          callback: function (value: any) {
            return formatIndianNumber(value);
          },
        },
      },
    },
  };

  // Asset Composition - Donut Chart
  const deposits = parseInt(
    Number(statistics.totalMemberPeriodicDeposits).toString()
  );
  const vendorInvestment = parseInt(
    Number(statistics.totalVendorHolding || 0).toString()
  );
  const loanValue = parseInt(Number(statistics.totalLoanBalance).toString());
  const returnsProfit = parseInt(
    Number(
      statistics.totalVendorProfit + statistics.totalInterestPaid
    ).toString()
  );
  const pendingAmounts = parseInt(
    Number(
      statistics.totalInterestBalance +
        statistics.totalOffsetBalance +
        statistics.totalMemberPeriodicDepositsBalance
    ).toString()
  );

  const totalAssets =
    deposits + vendorInvestment + loanValue + returnsProfit + pendingAmounts;

  const assetChartData = {
    labels: [
      "Deposits",
      "Vendor Investment",
      "Loan Value",
      "Returns/Profit",
      "Pending Amounts",
    ],
    datasets: [
      {
        data: [
          deposits,
          vendorInvestment,
          loanValue,
          returnsProfit,
          pendingAmounts,
        ],
        backgroundColor: [
          "rgb(147, 197, 253)", // blue-300 (pastel)
          "rgb(134, 239, 172)", // green-300 (pastel)
          "rgb(253, 224, 71)", // yellow-300 (pastel)
          "rgb(251, 191, 36)", // amber-400 (pastel)
          "rgb(252, 165, 165)", // red-300 (pastel)
        ],
        borderWidth: 3,
        borderColor: "hsl(var(--card))",
      },
    ],
  };

  const assetChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%", // Thick ring
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 12,
          usePointStyle: true,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed;
            const percentage =
              totalAssets > 0
                ? ((value / totalAssets) * 100).toFixed(1)
                : "0.0";
            return `${label}: ${formatIndianNumber(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Cash Flow Trend - Multi-line Chart */}
      <Card className="rounded-xl border-border/50 bg-card shadow-sm lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            CASH FLOW TREND
          </CardTitle>
          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-time">All Time</SelectItem>
              {yearOptions.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
              <SelectItem value="3">Last 3 Months</SelectItem>
              <SelectItem value="6">Last 6 Months</SelectItem>
              <SelectItem value="12">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {isLoadingChartData || !trendData || trendData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {isLoadingChartData
                  ? "Loading chart data..."
                  : "No data available"}
              </div>
            ) : (
              <Line data={cashFlowChartData} options={cashFlowChartOptions} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Asset Composition - Donut Chart */}
      <Card className="rounded-xl border-border/50 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            ASSET COMPOSITION
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <Doughnut data={assetChartData} options={assetChartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
