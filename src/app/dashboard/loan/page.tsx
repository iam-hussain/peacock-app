"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Camera, Download, FolderSync, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/atoms/data-table";
import { FilterBar } from "@/components/atoms/filter-bar";
import { FilterChips } from "@/components/atoms/filter-chips";
import { PageHeader } from "@/components/atoms/page-header";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import { SearchBarMobile } from "@/components/atoms/search-bar-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { dateFormat, newZoneDate } from "@/lib/date";
import { fetchLoans } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";
import { TransformedLoan } from "@/transformers/account";

export default function LoansPage() {
  const { data, isLoading } = useQuery(fetchLoans());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Determine loan status
  const getLoanStatus = (loan: TransformedLoan) => {
    if (loan.totalLoanBalance > 0) {
      return { label: "Active", color: "bg-blue-500" };
    }
    return { label: "Cleared", color: "bg-green-500" };
  };

  // Filter loans
  const filteredLoans = useMemo(() => {
    const loans = data?.accounts || [];
    let filtered = loans;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.id.toLowerCase().includes(query) ||
          l.slug.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((l) => l.totalLoanBalance > 0);
    } else if (statusFilter === "closed") {
      filtered = filtered.filter((l) => l.totalLoanBalance === 0);
    }

    return filtered;
  }, [data?.accounts, searchQuery, statusFilter]);

  const handleViewLoan = (loan: TransformedLoan) => {
    window.location.href = loan.link;
  };

  const handleAddRepayment = (loan: TransformedLoan) => {
    window.location.href = `/dashboard/transaction?member=${loan.slug}&type=LOAN_REPAY`;
  };

  const handleEditLoan = (loan: TransformedLoan) => {
    console.log("Edit loan", loan);
  };

  const handleDeleteLoan = (loan: TransformedLoan) => {
    console.log("Delete loan", loan);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  // Calculate loan duration
  const getLoanDuration = (loan: TransformedLoan) => {
    if (!loan.startAt) return null;
    return loan.recentPassedString || null;
  };

  // Define columns
  const columns: ColumnDef<TransformedLoan>[] = useMemo(
    () => [
      {
        id: "member",
        accessorKey: "name",
        header: "Member",
        enableSorting: true,
        meta: {
          tooltip: "Member name, avatar, and loan status.",
        },
        cell: ({ row }) => {
          const loan = row.original;
          const status = getLoanStatus(loan);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={loan.avatar} alt={loan.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {loan.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Link
                  href={loan.link}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {loan.name}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${status.color}`} />
                  <span className="text-xs text-muted-foreground">
                    {status.label}
                  </span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "loanStart",
        accessorKey: "startAt",
        header: "Loan Start",
        enableSorting: true,
        meta: {
          tooltip: "Loan start date and duration.",
        },
        cell: ({ row }) => {
          const loan = row.original;
          const duration = getLoanDuration(loan);
          if (!loan.startAt || loan.totalLoanBalance === 0) {
            return <div className="text-sm text-muted-foreground/50">-</div>;
          }
          return (
            <div className="flex flex-col">
              <div className="text-sm text-foreground">
                {dateFormat(newZoneDate(loan.startAt))}
              </div>
              {duration && (
                <Badge
                  variant="secondary"
                  className="mt-1 w-fit bg-muted text-xs font-normal"
                >
                  {duration}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "amountTaken",
        accessorKey: "totalLoanTaken",
        header: "Amount Taken",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total loan amount taken by this member.",
        },
        cell: ({ row }) => {
          const amount = row.original.totalLoanTaken || 0;
          return (
            <div className="text-right text-sm font-medium text-foreground">
              {moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "totalPaid",
        accessorKey: "totalLoanRepay",
        header: "Total Paid",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total amount repaid by this member.",
        },
        cell: ({ row }) => {
          const amount = row.original.totalLoanRepay || 0;
          return (
            <div className="text-right text-sm font-medium text-green-600 dark:text-green-500">
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
        id: "outstanding",
        accessorKey: "totalLoanBalance",
        header: "Outstanding",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Outstanding loan balance (amount taken - amount paid).",
        },
        cell: ({ row }) => {
          const amount = row.original.totalLoanBalance || 0;
          return (
            <div
              className={`text-right text-sm font-medium ${
                amount > 0
                  ? "text-destructive"
                  : amount === 0
                    ? "text-muted-foreground/50"
                    : "text-green-600 dark:text-green-500"
              }`}
            >
              {amount === 0 ? "-" : moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "totalLoanBalance",
        header: "Status",
        enableSorting: true,
        meta: {
          tooltip: "Loan status: Active (has balance) or Cleared (paid off).",
        },
        cell: ({ row }) => {
          const loan = row.original;
          const status = getLoanStatus(loan);
          return (
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${status.color}`} />
              <span className="text-sm text-foreground">{status.label}</span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <MoreHorizontal className="h-4 w-4" />,
        enableSorting: false,
        meta: {
          tooltip: "More loan actions.",
        },
        cell: ({ row }) => {
          const loan = row.original;
          return (
            <RowActionsMenu
              onViewDetails={() => handleViewLoan(loan)}
              onEdit={() => handleEditLoan(loan)}
              onViewTransactions={() => handleAddRepayment(loan)}
              onDeactivate={() => handleDeleteLoan(loan)}
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
          title="Loans Overview"
          subtitle="Track member loans, repayments, and outstanding balances."
          primaryAction={{
            label: "Add Loan",
            icon: <FolderSync className="h-4 w-4" />,
            onClick: () => {
              window.location.href = "/dashboard/transaction?type=LOAN_TAKEN";
            },
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
          Loans Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Track member loans, repayments, and outstanding balances.
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
                { label: "All Loans", value: "all" },
                { label: "Active Loans", value: "active" },
                { label: "Closed Loans", value: "closed" },
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
          data={filteredLoans}
          frozenColumnKey="member"
          isLoading={isLoading}
        />
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-6 px-4 pb-24">
        {/* Search Bar */}
        <SearchBarMobile
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search loans..."
        />

        {/* Filter Chips */}
        <FilterChips
          chips={[
            { label: "All Loans", value: "all" },
            { label: "Active Loans", value: "active" },
            { label: "Closed Loans", value: "closed" },
          ]}
          selectedValue={statusFilter}
          onChange={setStatusFilter}
        />

        {/* Loan List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filteredLoans.length > 0 ? (
          <div className="space-y-4">
            {filteredLoans.map((loan) => {
              const status = getLoanStatus(loan);
              return (
                <div
                  key={loan.id}
                  className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
                  onClick={() => handleViewLoan(loan)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12 rounded-lg">
                      <AvatarImage src={loan.avatar} alt={loan.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold rounded-lg">
                        {loan.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-foreground">
                        {loan.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${status.color}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Amount Taken
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {moneyFormat(loan.totalLoanTaken || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Total Paid
                      </div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-500">
                        {loan.totalLoanRepay === 0
                          ? "-"
                          : moneyFormat(loan.totalLoanRepay)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Outstanding
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          loan.totalLoanBalance > 0
                            ? "text-destructive"
                            : "text-muted-foreground/50"
                        }`}
                      >
                        {loan.totalLoanBalance === 0
                          ? "-"
                          : moneyFormat(loan.totalLoanBalance)}
                      </div>
                    </div>
                    {loan.startAt && loan.totalLoanBalance > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Started
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {dateFormat(newZoneDate(loan.startAt))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
            No loans found
          </div>
        )}
      </div>
    </div>
  );
}
