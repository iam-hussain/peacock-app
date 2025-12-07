'use client'
import { useQuery } from '@tanstack/react-query'

import { StatsSection } from '@/components/molecules/stats-section'
import { MembersPreview } from '@/components/molecules/members-preview'
import { EnhancedChartsSection } from '@/components/molecules/enhanced-charts-section'
import { ActivityFeed } from '@/components/molecules/activity-feed'
import Box from '@/components/ui/box'
import { fetchStatistics } from '@/lib/query-options'

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery(fetchStatistics())
  const statistics = data?.statistics || null
  const members = data?.members || []

  if (isLoading) {
    return (
      <Box className="w-full max-w-6xl mx-auto">
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </Box>
    )
  }

  if (isError || !statistics) {
    return (
      <Box className="w-full max-w-6xl mx-auto">
        <div className="p-8 text-center w-full text-destructive">
          Unexpected error on fetching the data
        </div>
      </Box>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of your financial club management
        </p>
      </div>

      {/* Stats Section */}
      <StatsSection statistics={statistics} />

      {/* Charts Section */}
      <EnhancedChartsSection statistics={statistics} />

      {/* Members Preview and Activity Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MembersPreview initialMembers={members} />
        </div>
        <div>
          <ActivityFeed limit={8} />
        </div>
      </div>
    </div>
  )
}
