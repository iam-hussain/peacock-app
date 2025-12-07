'use client'

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { TransformedStatistics } from '@/app/api/statistics/route'
import { formatIndianNumber } from '@/lib/utils'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

interface EnhancedChartsSectionProps {
  statistics: TransformedStatistics
}

export function EnhancedChartsSection({
  statistics,
}: EnhancedChartsSectionProps) {
  // Flow Overview - Stacked Bar Chart
  const available = parseInt(
    Number(statistics.currentClubBalance || 0).toString()
  )
  const invested = parseInt(
    Number(statistics.totalLoanBalance + statistics.totalVendorHolding).toString()
  )
  const pending = parseInt(
    Number(
      statistics.totalInterestBalance +
        statistics.totalOffsetBalance +
        statistics.totalMemberPeriodicDepositsBalance
    ).toString()
  )

  const flowChartData = {
    labels: ['Fund Distribution'],
    datasets: [
      {
        label: 'Available',
        data: [available],
        backgroundColor: 'rgb(34, 197, 94)', // green-500
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
      {
        label: 'Invested',
        data: [invested],
        backgroundColor: 'rgb(59, 130, 246)', // blue-500
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Pending',
        data: [pending],
        backgroundColor: 'rgb(234, 179, 8)', // yellow-500
        borderColor: 'rgb(234, 179, 8)',
        borderWidth: 1,
      },
    ],
  }

  const flowChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
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
            const label = context.dataset.label || ''
            const value = context.parsed.y
            const total = available + invested + pending
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${formatIndianNumber(value)} (${percentage}%)`
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        display: false,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatIndianNumber(value)
          },
        },
      },
    },
  }

  // Fund Overview - Doughnut Chart
  const deposit = parseInt(
    Number(statistics.totalMemberPeriodicDeposits).toString()
  )
  const offset = parseInt(Number(statistics.totalOffsetPaid).toString())
  const returns = parseInt(Number(statistics.totalInterestPaid).toString())

  const fundChartData = {
    labels: ['Deposits', 'Offset', 'Returns'],
    datasets: [
      {
        data: [deposit, offset, returns],
        backgroundColor: [
          'rgb(34, 197, 94)', // green-500
          'rgb(59, 130, 246)', // blue-500
          'rgb(234, 179, 8)', // yellow-500
        ],
        borderWidth: 2,
        borderColor: 'hsl(var(--card))',
      },
    ],
  }

  const fundChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
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
            const label = context.label || ''
            const value = context.parsed
            const total = deposit + offset + returns
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${formatIndianNumber(value)} (${percentage}%)`
          },
        },
      },
    },
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Flow Overview - Stacked Bar Chart */}
      <Card className="rounded-xl border-border/50 bg-card shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Flow Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Bar data={flowChartData} options={flowChartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Fund Overview - Doughnut Chart */}
      <Card className="rounded-xl border-border/50 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fund Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Doughnut data={fundChartData} options={fundChartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

