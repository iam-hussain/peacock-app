"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Camera, Download, MoreHorizontal, Pin, PinOff } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ClickableAvatar } from "@/components/atoms/clickable-avatar";
import { DataTable } from "@/components/atoms/data-table";
import { DesktopTableOnly } from "@/components/atoms/desktop-table-only";
import { FilterBar } from "@/components/atoms/filter-bar";
import { PageHeader } from "@/components/atoms/page-header";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import PageTransition from "@/components/molecules/page-transition";
import { ScreenshotArea } from "@/components/molecules/screenshot-area";
import { useTableExport } from "@/hooks/use-table-export";
import { dateFormat, newZoneDate } from "@/lib/core/date";
import { fetchMembers } from "@/lib/query-options";
import { moneyFormat } from "@/lib/ui/utils";
import { TransformedMember } from "@/transformers/account";

export default function MembersPage() {
  const { data, isLoading } = useQuery(fetchMembers());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [stickyEnabled, setStickyEnabled] = useState(true);

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
          m.username.toLowerCase().includes(query) ||
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
          const amount = row.original.totalDepositAmount || 0;
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
        header: "Adjust.",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip:
            "All manual member adjustments (offsets, corrections, waivers).",
          columnClassName: "w-[6.5rem] max-w-[6.5rem]",
        },
        cell: ({ row }) => {
          const amount = row.original.totalOffsetAmount || 0;
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
          const amount = row.original.totalBalanceAmount || 0;
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
          const amount = row.original.totalReturnAmount || 0;
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
          const amount = row.original.netValue || 0;
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
              onViewDetails={() => {
                window.location.href = member.link;
              }}
              onViewTransactions={() => {
                window.location.href = `/dashboard/transaction?member=${member.username}`;
              }}
            />
          );
        },
      },
    ],
    []
  );

  // Table export functionality
  const {
    handleExportCsv,
    handleScreenshot,
    tableRef,
    capturedAt,
    identifier,
  } = useTableExport({
    tableName: "members",
    columns,
    data: filteredMembers,
    title: "Members",
  });

  return (
    <PageTransition>
      <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6 pb-20 lg:pb-6">
        <PageHeader
          title="Members Overview"
          subtitle="View member details, funds managed, balances, and performance."
          secondaryActions={[
            {
              label: stickyEnabled ? "Sticky on" : "Sticky off",
              icon: stickyEnabled ? (
                <Pin className="h-4 w-4" />
              ) : (
                <PinOff className="h-4 w-4" />
              ),
              onClick: () => setStickyEnabled((v) => !v),
            },
            {
              label: "Export CSV",
              icon: <Download className="h-4 w-4" />,
              onClick: handleExportCsv,
            },
            {
              label: "Screenshot",
              icon: <Camera className="h-4 w-4" />,
              onClick: handleScreenshot,
            },
          ]}
        />

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

        <div ref={tableRef}>
          <DataTable
            columns={columns}
            data={filteredMembers}
            frozenColumnKey="member"
            isLoading={isLoading}
            sticky={stickyEnabled}
          />
        </div>

        <ScreenshotArea
          title="Members"
          capturedAt={capturedAt}
          identifier={identifier}
        >
          <div style={{ width: "100%", minWidth: 1200 }}>
            <DesktopTableOnly
              columns={columns.filter((col) => col.id !== "actions")}
              data={filteredMembers}
              frozenColumnKey="member"
            />
          </div>
        </ScreenshotArea>
      </div>
    </PageTransition>
  );
}
