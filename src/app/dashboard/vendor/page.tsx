"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Camera, Download, MoreHorizontal, Pin, PinOff } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TransformedVendor } from "@/app/api/account/vendor/route";
import { DataTable } from "@/components/atoms/data-table";
import { DesktopTableOnly } from "@/components/atoms/desktop-table-only";
import { FilterBar } from "@/components/atoms/filter-bar";
import { PageHeader } from "@/components/atoms/page-header";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import PageTransition from "@/components/molecules/page-transition";
import { ScreenshotArea } from "@/components/molecules/screenshot-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTableExport } from "@/hooks/use-table-export";
import { dateFormat, newZoneDate } from "@/lib/core/date";
import { fetchVendors } from "@/lib/query-options";
import { moneyFormat } from "@/lib/ui/utils";

export default function VendorsPage() {
  const { data, isLoading } = useQuery(fetchVendors());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [stickyEnabled, setStickyEnabled] = useState(false);

  // Filter vendors
  const filteredVendors = useMemo(() => {
    const vendors = data?.vendors || [];
    let filtered = vendors;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((v) => v.active);
    } else if (statusFilter === "closed") {
      filtered = filtered.filter((v) => !v.active);
    }

    return filtered;
  }, [data?.vendors, searchQuery, statusFilter]);

  const handleViewDetails = (vendor: TransformedVendor) => {
    window.location.href = `/dashboard/vendor/${vendor.id}`;
  };

  const handleViewTransactions = (vendor: TransformedVendor) => {
    window.location.href = `/dashboard/transaction?account=${vendor.id}`;
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  // Calculate cycle duration
  const getCycleDuration = (vendor: TransformedVendor) => {
    if (!vendor.startAt || !vendor.endAt) return null;
    const start = newZoneDate(vendor.startAt);
    const end = newZoneDate(vendor.endAt);
    const months = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    return `${months} mons`;
  };

  // Define columns
  const columns: ColumnDef<TransformedVendor>[] = useMemo(
    () => [
      {
        id: "vendor",
        accessorKey: "name",
        header: "Vendor",
        enableSorting: true,
        meta: {
          tooltip: "Vendor code, name, and status.",
        },
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={vendor.avatar} alt={vendor.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {vendor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <Badge
                  variant="secondary"
                  className="hidden sm:inline-flex w-fit bg-primary/10 text-primary text-xs font-medium"
                >
                  {vendor.id}
                </Badge>
                <Link
                  href="#"
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {vendor.name}
                </Link>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      vendor.active ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {vendor.status}
                  </span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "cycle",
        accessorKey: "startAt",
        header: "Cycle",
        enableSorting: true,
        meta: {
          tooltip: "Investment cycle start and end dates with duration.",
          columnClassName: "min-w-[11rem] whitespace-nowrap",
        },
        cell: ({ row }) => {
          const vendor = row.original;
          const duration = getCycleDuration(vendor);
          const startDate = vendor.startAt
            ? dateFormat(newZoneDate(vendor.startAt))
            : "N/A";
          const endDate =
            vendor.endAt !== null && vendor.endAt !== undefined
              ? dateFormat(newZoneDate(vendor.endAt))
              : null;
          return (
            <div className="flex flex-col">
              <div className="text-sm text-foreground">{startDate}</div>
              {endDate && (
                <>
                  <div className="text-xs text-muted-foreground">
                    → {endDate}
                  </div>
                  {duration && (
                    <div className="text-xs text-muted-foreground">
                      {duration}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        },
      },
      {
        id: "investment",
        accessorKey: "totalInvestment",
        header: "Investment",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total amount invested in this vendor.",
        },
        cell: ({ row }) => {
          const amount = row.original.totalInvestment || 0;
          return (
            <div className="text-right text-sm font-medium text-foreground">
              {moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "returns",
        accessorKey: "totalReturns",
        header: "Returns",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total returns received from this vendor.",
        },
        cell: ({ row }) => {
          const amount = row.original.totalReturns || 0;
          return (
            <div className="text-right text-sm font-medium text-muted-foreground">
              {amount === 0 ? (
                <span className="text-muted-foreground/50">-</span>
              ) : (
                moneyFormat(amount)
              )}
            </div>
          );
        },
      },
      {
        id: "profit",
        accessorKey: "totalProfitAmount",
        header: "Profit",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Net profit (returns - investment).",
        },
        cell: ({ row }) => {
          const amount = row.original.totalProfitAmount || 0;
          return (
            <div
              className={`text-right text-sm font-medium ${
                amount > 0
                  ? "text-green-600 dark:text-green-500"
                  : "text-muted-foreground/50"
              }`}
            >
              {amount === 0 ? "-" : moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <MoreHorizontal className="h-4 w-4" />,
        enableSorting: false,
        meta: {
          tooltip: "More vendor actions.",
        },
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <RowActionsMenu
              onViewDetails={() => handleViewDetails(vendor)}
              onViewTransactions={() => handleViewTransactions(vendor)}
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
    tableName: "vendors",
    columns,
    data: filteredVendors,
    title: "Vendors",
  });

  return (
    <PageTransition>
      <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6 pb-20 lg:pb-6">
        <PageHeader
          title="Vendors Overview"
          subtitle="View vendor investments, cycles, returns, and performance."
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
          searchPlaceholder="Search vendors..."
          filters={{
            status: {
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Closed", value: "closed" },
              ],
            },
          }}
          onReset={handleResetFilters}
        />

        <div ref={tableRef}>
          <DataTable
            columns={columns}
            data={filteredVendors}
            frozenColumnKey="vendor"
            isLoading={isLoading}
            sticky={stickyEnabled}
          />
        </div>

        <ScreenshotArea
          title="Vendors"
          capturedAt={capturedAt}
          identifier={identifier}
        >
          <div style={{ width: "100%", minWidth: 1200 }}>
            <DesktopTableOnly
              columns={columns.filter((col) => col.id !== "actions")}
              data={filteredVendors}
              frozenColumnKey="vendor"
            />
          </div>
        </ScreenshotArea>
      </div>
    </PageTransition>
  );
}
