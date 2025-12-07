"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Download,
  MoreHorizontal,
  Receipt,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TransformedTransaction } from "@/app/api/transaction/route";
import { ClickableAvatar } from "@/components/atoms/clickable-avatar";
import { DataTable } from "@/components/atoms/data-table";
import { FilterBar } from "@/components/atoms/filter-bar";
import { FilterChips } from "@/components/atoms/filter-chips";
import { PageHeader } from "@/components/atoms/page-header";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import { SearchBarMobile } from "@/components/atoms/search-bar-mobile";
import { PaginationControls } from "@/components/molecules/pagination-controls";
import { TransactionCardMobile } from "@/components/molecules/transaction-card-mobile";
import { TransactionFilterDrawer } from "@/components/molecules/transaction-filter-drawer";
import { TransactionFormDialog } from "@/components/molecules/transaction-form-dialog";
import { TransactionSummaryCard } from "@/components/molecules/transaction-summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { transactionTypeMap } from "@/lib/config";
import { dateFormat, newZoneDate } from "@/lib/date";
import { fetchAccountSelect, fetchTransactions } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";

export default function TransactionsPage() {
  const { data: accounts = [] } = useQuery(fetchAccountSelect());
  const [searchQuery, setSearchQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransformedTransaction | null>(null);

  // Build query options
  const queryOptions = useMemo(
    () => ({
      accountId: accountFilter === "all" ? "" : accountFilter,
      transactionType: typeFilter === "all" ? "" : typeFilter,
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined,
      limit: pageSize,
      page: currentPage,
      sortField: "transactionAt",
      sortOrder: "desc" as const,
    }),
    [accountFilter, typeFilter, startDate, endDate, pageSize, currentPage]
  );

  const { data, isLoading, isError } = useQuery(
    fetchTransactions(queryOptions)
  );

  // Use transactions directly from API (filtering is done server-side)
  const transactions = data?.transactions || [];
  const totalTransactions = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Calculate inflow/outflow summary
  const summary = useMemo(() => {
    let inflow = 0;
    let outflow = 0;

    transactions.forEach((t) => {
      // Inflow: money coming TO club
      if (
        [
          "PERIODIC_DEPOSIT",
          "OFFSET_DEPOSIT",
          "REJOIN",
          "VENDOR_RETURNS",
          "LOAN_REPAY",
          "LOAN_INTEREST",
        ].includes(t.transactionType)
      ) {
        inflow += t.amount;
      }
      // Outflow: money going FROM club
      else if (
        ["WITHDRAW", "VENDOR_INVEST", "LOAN_TAKEN"].includes(t.transactionType)
      ) {
        outflow += t.amount;
      }
      // Transfers are neutral
    });

    return { inflow, outflow };
  }, [transactions]);

  // Determine transaction direction and color
  const getTransactionDirection = (transaction: TransformedTransaction) => {
    const isInflow = [
      "PERIODIC_DEPOSIT",
      "OFFSET_DEPOSIT",
      "REJOIN",
      "VENDOR_RETURNS",
      "LOAN_REPAY",
      "LOAN_INTEREST",
    ].includes(transaction.transactionType);

    const isOutflow = ["WITHDRAW", "VENDOR_INVEST", "LOAN_TAKEN"].includes(
      transaction.transactionType
    );

    if (isInflow) {
      return {
        direction: "in",
        color: "text-green-600 dark:text-green-500",
        icon: ArrowDown,
      };
    }
    if (isOutflow) {
      return { direction: "out", color: "text-destructive", icon: ArrowUp };
    }
    return { direction: "neutral", color: "text-muted-foreground", icon: null };
  };

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setDialogOpen(true);
  };

  const handleEditTransaction = (transaction: TransformedTransaction) => {
    setSelectedTransaction(transaction);
    setDialogOpen(true);
  };

  const handleViewTransaction = (transaction: TransformedTransaction) => {
    setSelectedTransaction(transaction);
    setDialogOpen(true);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setAccountFilter("all");
    setTypeFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setFilterDrawerOpen(false);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // All transaction type options (for filter drawer)
  const allTransactionTypeOptions = [
    { label: "All Types", value: "all" },
    { label: "Member's Deposit", value: "PERIODIC_DEPOSIT" },
    { label: "Member's Offset Deposit", value: "OFFSET_DEPOSIT" },
    { label: "Member's Withdrawal", value: "WITHDRAW" },
    { label: "Member's Rejoin Deposit", value: "REJOIN" },
    { label: "Club Funds Transfer", value: "FUNDS_TRANSFER" },
    { label: "Vendor Investment", value: "VENDOR_INVEST" },
    { label: "Vendor Return", value: "VENDOR_RETURNS" },
    { label: "Loan Taken", value: "LOAN_TAKEN" },
    { label: "Loan Repayment", value: "LOAN_REPAY" },
    { label: "Loan Interest", value: "LOAN_INTEREST" },
  ];

  // Mobile filter chips (simplified)
  const mobileFilterChips = [
    { label: "All Types", value: "all" },
    { label: "Deposit", value: "PERIODIC_DEPOSIT" },
    { label: "Withdrawal", value: "WITHDRAW" },
    { label: "Loan", value: "LOAN_TAKEN" },
    { label: "Transfer", value: "FUNDS_TRANSFER" },
    { label: "Vendor", value: "VENDOR_INVEST" },
  ];

  // Account options
  const accountOptions = [
    { label: "All Accounts", value: "all" },
    ...accounts.map((acc) => ({
      label: acc.name,
      value: acc.id,
    })),
  ];

  // Define columns for desktop table
  const columns: ColumnDef<TransformedTransaction>[] = useMemo(
    () => [
      {
        id: "from",
        accessorKey: "from.name",
        header: "From",
        enableSorting: true,
        meta: {
          tooltip: "Source account or member for this transaction.",
        },
        cell: ({ row }) => {
          const transaction = row.original;
          const account = transaction.from;
          const memberLink =
            account.link ||
            (account.isMember
              ? `/dashboard/member/${account.slug}`
              : undefined);
          return (
            <div className="flex items-center gap-3">
              {memberLink ? (
                <ClickableAvatar
                  src={account.avatar}
                  alt={account.name}
                  name={account.name}
                  href={memberLink}
                  size="md"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {account.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
              <div className="flex flex-col">
                {memberLink ? (
                  <Link
                    href={memberLink}
                    className="text-sm font-semibold text-foreground hover:underline"
                  >
                    {account.name}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-foreground">
                    {account.name}
                  </span>
                )}
                {account.sub && (
                  <span className="text-xs text-muted-foreground">
                    {account.sub}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "to",
        accessorKey: "to.name",
        header: "To",
        enableSorting: true,
        meta: {
          tooltip: "Destination account or member for this transaction.",
        },
        cell: ({ row }) => {
          const transaction = row.original;
          const account = transaction.to;
          const memberLink =
            account.link ||
            (account.isMember
              ? `/dashboard/member/${account.slug}`
              : undefined);
          return (
            <div className="flex items-center gap-3">
              {memberLink ? (
                <ClickableAvatar
                  src={account.avatar}
                  alt={account.name}
                  name={account.name}
                  href={memberLink}
                  size="md"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {account.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
              <div className="flex flex-col">
                {memberLink ? (
                  <Link
                    href={memberLink}
                    className="text-sm font-semibold text-foreground hover:underline"
                  >
                    {account.name}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-foreground">
                    {account.name}
                  </span>
                )}
                {account.sub && (
                  <span className="text-xs text-muted-foreground">
                    {account.sub}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "type",
        accessorKey: "transactionType",
        header: "Type",
        enableSorting: true,
        meta: {
          tooltip:
            "Type of transaction (deposit, withdrawal, loan, transfer, etc.).",
        },
        cell: ({ row }) => {
          return (
            <div className="text-sm text-foreground">
              {transactionTypeMap[row.original.transactionType]}
            </div>
          );
        },
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Transaction amount. Green = inflow, Red = outflow.",
        },
        cell: ({ row }) => {
          const transaction = row.original;
          const { color, icon: Icon } = getTransactionDirection(transaction);
          return (
            <div className={`flex items-center justify-end gap-1.5 ${color}`}>
              {Icon && <Icon className="h-3 w-3" />}
              <span className="text-sm font-medium">
                {moneyFormat(transaction.amount)}
              </span>
            </div>
          );
        },
      },
      {
        id: "occurred",
        accessorKey: "transactionAt",
        header: "Transaction At",
        enableSorting: true,
        meta: {
          tooltip: "When this transaction actually happened.",
        },
        cell: ({ row }) => {
          return (
            <div className="text-sm text-foreground">
              {dateFormat(newZoneDate(row.original.transactionAt))}
            </div>
          );
        },
      },
      {
        id: "recorded",
        accessorKey: "createdAt",
        header: "Created At",
        enableSorting: true,
        meta: {
          tooltip: "When this transaction was recorded in the system.",
        },
        cell: ({ row }) => {
          const date = newZoneDate(row.original.createdAt);
          return (
            <div className="text-sm text-muted-foreground">
              {dateFormat(date)}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <MoreHorizontal className="h-4 w-4" />,
        enableSorting: false,
        meta: {
          tooltip: "More transaction actions.",
        },
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <RowActionsMenu
              onViewDetails={() => handleViewTransaction(transaction)}
              onEdit={() => handleEditTransaction(transaction)}
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
          title="Transaction History"
          subtitle="Review all deposits, withdrawals, transfers, loans, and vendor movements."
          primaryAction={{
            label: "Add Transaction",
            icon: <Receipt className="h-4 w-4" />,
            onClick: handleAddTransaction,
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
      <div className="lg:hidden space-y-2">
        <h1 className="text-xl font-semibold text-foreground">
          Transaction History
        </h1>
        <p className="text-sm text-muted-foreground">
          Review all deposits, withdrawals, transfers, loans, and vendor
          movements.
        </p>
      </div>

      {/* Summary Card */}
      <TransactionSummaryCard
        inflow={summary.inflow}
        outflow={summary.outflow}
      />

      {/* Desktop Filter Bar */}
      <div className="hidden lg:block">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={{
            account: {
              value: accountFilter,
              onChange: setAccountFilter,
              options: accountOptions,
            },
            type: {
              value: typeFilter,
              onChange: setTypeFilter,
              options: allTransactionTypeOptions,
            },
          }}
          dateRange={{
            startDate,
            endDate,
            onStartDateChange: setStartDate,
            onEndDateChange: setEndDate,
          }}
          pageSize={{
            value: pageSize,
            onChange: setPageSize,
            options: [10, 25, 50],
          }}
          onReset={handleResetFilters}
        />
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden space-y-3">
        {/* Search Bar */}
        <SearchBarMobile
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search transactions..."
        />

        {/* Filter Pills + Filter Button */}
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto">
            <FilterChips
              chips={mobileFilterChips}
              selectedValue={typeFilter}
              onChange={setTypeFilter}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFilterDrawerOpen(true)}
            className="shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="sr-only">Open filters</span>
          </Button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive">
                We couldn&apos;t load transactions. Try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={transactions}
          frozenColumnKey="from"
          isLoading={isLoading}
        />
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 pb-20">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <TransactionCardMobile
                key={transaction.id}
                transaction={transaction}
                onClick={() => handleEditTransaction(transaction)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-border/50 bg-card">
            <CardContent className="p-8 text-center">
              <p className="mb-4 text-sm font-medium text-muted-foreground">
                No transactions match these filters yet.
              </p>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalTransactions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
          showPageSize={true}
          scrollToTop={true}
          className="mt-6"
        />
      )}

      {/* Filter Drawer (Mobile) */}
      <TransactionFilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        accountFilter={accountFilter}
        onAccountFilterChange={setAccountFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        accountOptions={accountOptions}
        typeOptions={allTransactionTypeOptions}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Transaction Form Dialog */}
      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selected={selectedTransaction}
        accounts={accounts}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
