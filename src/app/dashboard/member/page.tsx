"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Camera, Download, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ClickableAvatar } from "@/components/atoms/clickable-avatar";
import { DataTable } from "@/components/atoms/data-table";
import { FilterBar } from "@/components/atoms/filter-bar";
import { FilterChips } from "@/components/atoms/filter-chips";
import { MemberCardSkeleton } from "@/components/atoms/member-card-skeleton";
import { PageHeader } from "@/components/atoms/page-header";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import { SearchBarMobile } from "@/components/atoms/search-bar-mobile";
import { MemberCardMobile } from "@/components/molecules/member-card-mobile";
import { dateFormat, newZoneDate } from "@/lib/date";
import { fetchMembers } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";
import { TransformedMember } from "@/transformers/account";

export default function MembersPage() {
  const { data, isLoading } = useQuery(fetchMembers());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");

  // Filter members
  const filteredMembers = useMemo(() => {
    const members = data?.members || [];
    let filtered = members;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.slug.toLowerCase().includes(query) ||
          m.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((m) => m.active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((m) => !m.active);
    }

    // Balance filter
    if (balanceFilter === "high") {
      filtered = filtered.filter((m) => m.totalBalanceAmount > 0);
    } else if (balanceFilter === "low") {
      filtered = filtered.filter(
        (m) => m.totalBalanceAmount < 0 && m.totalBalanceAmount !== 0
      );
    } else if (balanceFilter === "zero") {
      filtered = filtered.filter((m) => m.totalBalanceAmount === 0);
    }

    return filtered;
  }, [data?.members, searchQuery, statusFilter, balanceFilter]);

  const handleViewDetails = (member: TransformedMember) => {
    window.location.href = member.link;
  };

  const handleViewTransactions = (member: TransformedMember) => {
    window.location.href = `/dashboard/transaction?member=${member.slug}`;
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setBalanceFilter("all");
  };

  // Define columns
  const columns: ColumnDef<TransformedMember>[] = useMemo(
    () => [
      {
        id: "member",
        accessorKey: "name",
        header: "Member",
        enableSorting: true,
        meta: {
          tooltip: "Member name, avatar and status.",
        },
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center gap-3">
              <ClickableAvatar
                src={member.avatar}
                alt={member.name}
                name={member.name}
                href={member.link}
                size="md"
              />
              <div className="flex flex-col">
                <Link
                  href={member.link}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {member.name}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      member.active ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {member.status}
                  </span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "fundsManaged",
        accessorKey: "clubHeldAmount",
        header: "Managed",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total club funds currently managed by this member.",
        },
        cell: ({ row }) => {
          const amount = row.original.clubHeldAmount || 0;
          return (
            <div className="text-right text-sm font-medium text-foreground">
              {moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "totalDeposits",
        accessorKey: "totalDepositAmount",
        header: "Deposits",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total deposits contributed by this member.",
        },
        cell: ({ row }) => {
          const amount = row.original.totalDepositAmount;
          return (
            <div className="text-right text-sm font-medium text-foreground">
              {moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "memberAdjustments",
        accessorKey: "totalOffsetAmount",
        header: "Adjustments",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip:
            "All manual member adjustments (offsets, corrections, waivers).",
        },
        cell: ({ row }) => {
          const amount = row.original.totalOffsetAmount;
          return (
            <div className="text-right text-sm font-medium text-foreground">
              {moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "outstandingBalance",
        accessorKey: "totalBalanceAmount",
        header: "Balance",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Amount still owed by the member. Negative = overpaid.",
        },
        cell: ({ row }) => {
          const amount = row.original.totalBalanceAmount;
          const isPositive = amount > 0;
          return (
            <div
              className={`text-right text-sm font-medium ${
                isPositive ? "text-destructive" : "text-green-600"
              }`}
            >
              {moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "profitEarned",
        accessorKey: "totalReturnAmount",
        header: "Profit",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total profit/returns earned for this member.",
        },
        cell: ({ row }) => {
          const amount = row.original.totalReturnAmount;
          return (
            <div className="text-right text-sm font-medium text-green-600">
              {moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "currentValue",
        accessorKey: "netValue",
        header: "Value",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Current value of this member's position including profit.",
        },
        cell: ({ row }) => {
          const amount = row.original.netValue;
          return (
            <div className="text-right text-sm font-semibold text-foreground">
              {moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "joinedOn",
        accessorKey: "startAt",
        header: "Joined",
        enableSorting: true,
        meta: {
          tooltip: "Date the member joined the club.",
        },
        cell: ({ row }) => {
          const date = newZoneDate(row.original.startAt);
          return (
            <div className="text-sm text-foreground">{dateFormat(date)}</div>
          );
        },
      },
      {
        id: "actions",
        header: () => <MoreHorizontal className="h-4 w-4" />,
        enableSorting: false,
        meta: {
          tooltip: "More member actions.",
        },
        cell: ({ row }) => {
          const member = row.original;
          return (
            <RowActionsMenu
              onViewDetails={() => handleViewDetails(member)}
              onViewTransactions={() => handleViewTransactions(member)}
            />
          );
        },
      },
    ],
    []
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6 pb-24 lg:pb-6">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <PageHeader
          title="Members Overview"
          subtitle="View member details, funds managed, balances, and performance."
          secondaryActions={[
            {
              label: "Export CSV",
              icon: <Download className="h-4 w-4" />,
              onClick: () => {
                // TODO: Implement CSV export
                console.log("Export CSV");
              },
            },
            {
              label: "Screenshot",
              icon: <Camera className="h-4 w-4" />,
              onClick: () => {
                // TODO: Implement screenshot
                console.log("Screenshot");
              },
            },
          ]}
        />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <PageHeader
          title="Members Overview"
          subtitle="View member details, funds managed, balances, and performance."
        />
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden lg:block">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search members..."
          filters={{
            status: {
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ],
            },
            balance: {
              value: balanceFilter,
              onChange: setBalanceFilter,
              options: [
                { label: "All Balances", value: "all" },
                { label: "High Balance", value: "high" },
                { label: "Low Balance", value: "low" },
                { label: "Zero Balance", value: "zero" },
              ],
            },
          }}
          onReset={handleResetFilters}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={filteredMembers}
          frozenColumnKey="member"
          isLoading={isLoading}
        />
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {/* Search Bar */}
        <SearchBarMobile
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search members..."
        />

        {/* Filter Chips */}
        <FilterChips
          chips={[
            { label: "All", value: "all" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
          selectedValue={statusFilter}
          onChange={setStatusFilter}
        />

        {/* Member List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <MemberCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {filteredMembers.map((member) => (
              <MemberCardMobile
                key={member.id}
                member={member}
                onViewDetails={() => handleViewDetails(member)}
                onViewTransactions={() => handleViewTransactions(member)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
            No members found
          </div>
        )}
      </div>
    </div>
  );
}
