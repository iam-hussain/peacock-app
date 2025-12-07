"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Briefcase, Camera, Download, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TransformedVendor } from "@/app/api/account/vendor/route";
import { DataTable } from "@/components/atoms/data-table";
import { FilterBar } from "@/components/atoms/filter-bar";
import { FilterChips } from "@/components/atoms/filter-chips";
import { PageHeader } from "@/components/atoms/page-header";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import { SearchBarMobile } from "@/components/atoms/search-bar-mobile";
import { VendorFormDialog } from "@/components/molecules/vendor-form-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { dateFormat, newZoneDate } from "@/lib/date";
import { fetchVendors } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";

export default function VendorsPage() {
  const { data, isLoading } = useQuery(fetchVendors());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<
    TransformedVendor["account"] | null
  >(null);

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

  const handleAddVendor = () => {
    setSelectedVendor(null);
    setDialogOpen(true);
  };

  const handleEditVendor = (vendor: TransformedVendor) => {
    setSelectedVendor(vendor.account);
    setDialogOpen(true);
  };

  const handleViewDetails = (vendor: TransformedVendor) => {
    // Navigate to vendor details if needed
    console.log("View vendor details", vendor);
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
            <div className="flex items-center gap-3">
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
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary text-xs font-medium"
                  >
                    {vendor.id}
                  </Badge>
                  <Link
                    href="#"
                    className="text-sm font-semibold text-foreground hover:underline"
                  >
                    {vendor.name}
                  </Link>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
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
        },
        cell: ({ row }) => {
          const vendor = row.original;
          const duration = getCycleDuration(vendor);
          return (
            <div className="flex flex-col">
              <div className="text-sm text-foreground">
                {dateFormat(newZoneDate(vendor.startAt))}
              </div>
              {vendor.endAt && (
                <>
                  <div className="text-xs text-muted-foreground">
                    → {dateFormat(newZoneDate(vendor.endAt))}
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
              onEdit={() => handleEditVendor(vendor)}
            />
          );
        },
      },
    ],
    []
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <PageHeader
          title="Vendors Overview"
          subtitle="Manage vendor investments, cycles, returns, and performance."
          primaryAction={{
            label: "Add Vendor",
            icon: <Briefcase className="h-4 w-4" />,
            onClick: handleAddVendor,
          }}
          secondaryActions={[
            {
              label: "Export CSV",
              icon: <Download className="h-4 w-4" />,
              onClick: () => {
                console.log("Export CSV");
              },
            },
            {
              label: "Screenshot",
              icon: <Camera className="h-4 w-4" />,
              onClick: () => {
                console.log("Screenshot");
              },
            },
          ]}
        />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden space-y-2 px-4 pt-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Vendors Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage vendor investments, cycles, returns, and performance.
        </p>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden lg:block">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
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
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={filteredVendors}
          frozenColumnKey="vendor"
          isLoading={isLoading}
        />
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-6 px-4 pb-24">
        {/* Search Bar */}
        <SearchBarMobile
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search vendors..."
        />

        {/* Filter Chips */}
        <FilterChips
          chips={[
            { label: "All", value: "all" },
            { label: "Active", value: "active" },
            { label: "Closed", value: "closed" },
          ]}
          selectedValue={statusFilter}
          onChange={setStatusFilter}
        />

        {/* Vendor List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filteredVendors.length > 0 ? (
          <div className="space-y-4">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
                onClick={() => handleEditVendor(vendor)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-lg">
                    <AvatarImage src={vendor.avatar} alt={vendor.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold rounded-lg">
                      {vendor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary text-xs font-medium"
                      >
                        {vendor.id}
                      </Badge>
                      <p className="text-base font-semibold text-foreground">
                        {vendor.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
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
                <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Investment
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {moneyFormat(vendor.totalInvestment || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Returns
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {vendor.totalReturns === 0
                        ? "-"
                        : moneyFormat(vendor.totalReturns)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Profit
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        vendor.totalProfitAmount > 0
                          ? "text-green-600 dark:text-green-500"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {vendor.totalProfitAmount === 0
                        ? "-"
                        : moneyFormat(vendor.totalProfitAmount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
            No vendors found
          </div>
        )}
      </div>

      <VendorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selected={selectedVendor}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
