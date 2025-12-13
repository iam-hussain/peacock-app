"use client";

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
import { clubAge } from "@/lib/core/date";
import { formatIndianNumber } from "@/lib/ui/utils";

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

// Helper to generate trend data (simulated historical data)
function generateTrendData(
  currentAvailable: number,
  currentInvested: number,
  currentPending: number,
  months: number
) {
  const data = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Simulate slight trend (this would be replaced with actual historical data)
    const trendFactor = 1 + (months - i) * 0.02;
    data.push({
      month: format(date, "MMM"),
      available: Math.max(
        0,
        currentAvailable * (0.7 + (trendFactor - 1) * 0.3)
      ),
      invested: Math.max(0, currentInvested * (0.8 + (trendFactor - 1) * 0.2)),
      pending: Math.max(0, currentPending * (0.9 + (trendFactor - 1) * 0.1)),
    });
  }

  return data;
}

export function EnhancedChartsSection({
  statistics,
}: EnhancedChartsSectionProps) {
  const club = clubAge();
  const [selectedRange, setSelectedRange] = useState<string>("all-time");

  // Calculate current values
  const available = parseInt(
    Number(statistics.currentClubBalance || 0).toString()
  );
  const invested = parseInt(
    Number(
      statistics.totalLoanBalance + statistics.totalVendorHolding
    ).toString()
  );
  const pending = parseInt(
    Number(
      statistics.totalInterestBalance +
        statistics.totalOffsetBalance +
        statistics.totalMemberPeriodicDepositsBalance
    ).toString()
  );

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

  // Calculate months for selected range
  const monthsForRange = useMemo(() => {
    if (selectedRange === "all-time") {
      return club.inMonth;
    } else if (selectedRange.startsWith("year-")) {
      const yearIndex = parseInt(selectedRange.split("-")[1]) - 1;
      const yearOption = yearOptions[yearIndex];
      if (yearOption) {
        const months =
          differenceInYears(yearOption.endDate, yearOption.startDate) * 12;
        return Math.min(months, club.inMonth);
      }
      return 12;
    } else {
      return parseInt(selectedRange);
    }
  }, [selectedRange, yearOptions, club.inMonth]);

  // Generate trend data based on selected range
  const trendData = useMemo(() => {
    return generateTrendData(available, invested, pending, monthsForRange);
  }, [available, invested, pending, monthsForRange]);

  // Cash Flow Trend - Multi-line Chart
  const cashFlowChartData = {
    labels: trendData.map((d) => d.month),
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
            <Line data={cashFlowChartData} options={cashFlowChartOptions} />
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
