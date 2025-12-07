"use client";

import { useQuery } from "@tanstack/react-query";

import { ActivityFeed } from "@/components/molecules/activity-feed";
import { EnhancedChartsSection } from "@/components/molecules/enhanced-charts-section";
import { MembersPreview } from "@/components/molecules/members-preview";
import { StatsSection } from "@/components/molecules/stats-section";
import Box from "@/components/ui/box";
import { fetchStatistics } from "@/lib/query-options";

export default function DashboardPage() {
  const { data, isLoading } = useQuery(fetchStatistics());

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.statistics) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <Box className="p-8 text-center text-muted-foreground">
          No statistics available
        </Box>
      </div>
    );
  }

  const { statistics, members } = data;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your financial club management
        </p>
      </div>

      {/* Stats Section */}
      <StatsSection statistics={statistics} />

      {/* Members Preview */}
      <MembersPreview initialMembers={members || []} />

      {/* Charts Section */}
      <EnhancedChartsSection statistics={statistics} />

      {/* Activity Feed */}
      <ActivityFeed limit={10} />
    </div>
  );
}
