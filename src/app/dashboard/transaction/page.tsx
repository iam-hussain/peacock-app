"use client";

export const dynamic = "force-dynamic";

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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { TransformedTransaction } from "@/app/api/transaction/route";
import { ClickableAvatar } from "@/components/atoms/clickable-avatar";
import { DataTable } from "@/components/atoms/data-table";
import { FilterBar } from "@/components/atoms/filter-bar";
import { PageHeader } from "@/components/atoms/page-header";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import { SearchBarMobile } from "@/components/atoms/search-bar-mobile";
import { FloatingActionButton } from "@/components/molecules/floating-action-button";
import { PaginationControls } from "@/components/molecules/pagination-controls";
import { TransactionCardMobile } from "@/components/molecules/transaction-card-mobile";
import { TransactionFilterDrawer } from "@/components/molecules/transaction-filter-drawer";
import { TransactionFormDialog } from "@/components/molecules/transaction-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useTableExport } from "@/hooks/use-table-export";
import { transactionTypeMap } from "@/lib/config";
import { dateFormat, newZoneDate } from "@/lib/date";
import { fetchAccountSelect, fetchTransactions } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";

export default function TransactionsPage() {
  const { canWrite } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const [isMounted, setIsMounted] = useState(false);
  const urlFilterApplied = useRef(false);
  const isInitialMount = useRef(true);

  // Ensure we're on client before using searchParams
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update URL with current filter values
  const updateURL = useCallback(
    (updates: {
      account?: string | null;
      type?: string | null;
      startDate?: Date | null | undefined;
      endDate?: Date | null | undefined;
      pageSize?: number;
      page?: number;
      clearMember?: boolean;
    }) => {
      const params = new URLSearchParams();

      // Handle account filter - if account is set, find member slug, otherwise keep member if exists
      if (updates.account !== undefined) {
        if (
          updates.account === "all" ||
          updates.clearMember ||
          !updates.account
        ) {
          params.delete("member");
          params.delete("account");
        } else {
          // Find account and use member username if available, otherwise use account ID
          const account = accounts.find((acc) => acc.id === updates.account);
          if (account?.username) {
            params.set("member", account.username);
          } else if (updates.account) {
            params.set("account", updates.account);
          }
        }
      } else {
        // Preserve existing member/account if not being updated
        const existingMember = searchParams.get("member");
        const existingAccount = searchParams.get("account");
        if (existingMember) {
          params.set("member", existingMember);
        } else if (existingAccount) {
          params.set("account", existingAccount);
        }
      }

      // Handle type filter
      if (updates.type !== undefined) {
        if (updates.type && updates.type !== "all") {
          params.set("type", updates.type);
        }
      } else {
        const existingType = searchParams.get("type");
        if (existingType) {
          params.set("type", existingType);
        }
      }

      // Handle date filters
      // Check if the key exists in updates object (even if value is undefined)
      if ("startDate" in updates) {
        if (updates.startDate && updates.startDate !== null) {
          params.set("startDate", updates.startDate.toISOString());
        } else {
          // Explicitly delete if null or undefined
          params.delete("startDate");
        }
      } else {
        const existingStartDate = searchParams.get("startDate");
        if (existingStartDate) {
          params.set("startDate", existingStartDate);
        }
      }

      if ("endDate" in updates) {
        if (updates.endDate && updates.endDate !== null) {
          params.set("endDate", updates.endDate.toISOString());
        } else {
          // Explicitly delete if null or undefined
          params.delete("endDate");
        }
      } else {
        const existingEndDate = searchParams.get("endDate");
        if (existingEndDate) {
          params.set("endDate", existingEndDate);
        }
      }

      // Handle page size - always include in URL
      if (updates.pageSize !== undefined) {
        params.set("pageSize", updates.pageSize.toString());
      } else {
        const existingPageSize = searchParams.get("pageSize");
        if (existingPageSize) {
          params.set("pageSize", existingPageSize);
        } else {
          // Default to 25 if not specified
          params.set("pageSize", "25");
        }
      }

      // Handle page - always include in URL
      if (updates.page !== undefined) {
        params.set("page", updates.page.toString());
      } else {
        const existingPage = searchParams.get("page");
        if (existingPage) {
          params.set("page", existingPage);
        } else {
          // Default to 1 if not specified
          params.set("page", "1");
        }
      }

      const newURL = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      router.push(newURL, { scroll: false });
    },
    [pathname, router, searchParams, accounts]
  );

  // Read initial values from URL on mount (only on client)
  useEffect(() => {
    if (!isMounted) return;
    if (isInitialMount.current && accounts.length > 0) {
      // Read account filter from URL (by member slug or account ID)
      const memberSlug = searchParams.get("member");
      const accountParam = searchParams.get("account");

      if (memberSlug) {
        const memberAccount = accounts.find(
          (acc) => acc.username === memberSlug || acc.id === memberSlug
        );
        if (memberAccount) {
          setAccountFilter(memberAccount.id);
          urlFilterApplied.current = true;
        }
      } else if (accountParam) {
        const account = accounts.find((acc) => acc.id === accountParam);
        if (account) {
          setAccountFilter(accountParam);
        }
      }

      // Read type filter
      const typeParam = searchParams.get("type");
      if (typeParam) {
        setTypeFilter(typeParam);
      }

      // Read date filters
      const startDateParam = searchParams.get("startDate");
      if (startDateParam) {
        setStartDate(new Date(startDateParam));
      }
      const endDateParam = searchParams.get("endDate");
      if (endDateParam) {
        setEndDate(new Date(endDateParam));
      }

      // Read page size
      const pageSizeParam = searchParams.get("pageSize");
      if (pageSizeParam) {
        setPageSize(parseInt(pageSizeParam, 10));
      }

      // Read page
      const pageParam = searchParams.get("page");
      if (pageParam) {
        setCurrentPage(parseInt(pageParam, 10));
      }

      isInitialMount.current = false;
    }
  }, [searchParams, accounts, isMounted]);

  // Track previous filter values to detect changes
  const prevFilters = useRef({ accountFilter, typeFilter, startDate, endDate });
  const prevPage = useRef(currentPage);
  const prevPageSize = useRef(pageSize);

  // Update URL when filters change - reset page to 1
  useEffect(() => {
    if (!isMounted || !isInitialMount.current) return;
    const filtersChanged =
      prevFilters.current.accountFilter !== accountFilter ||
      prevFilters.current.typeFilter !== typeFilter ||
      prevFilters.current.startDate?.getTime() !== startDate?.getTime() ||
      prevFilters.current.endDate?.getTime() !== endDate?.getTime();

    if (filtersChanged) {
      setCurrentPage(1);
      prevFilters.current = { accountFilter, typeFilter, startDate, endDate };
      updateURL({
        account: accountFilter,
        type: typeFilter,
        startDate,
        endDate,
        pageSize,
        page: 1, // Reset to page 1 when filters change
        clearMember: accountFilter === "all",
      });
    }
  }, [
    accountFilter,
    typeFilter,
    startDate,
    endDate,
    pageSize,
    updateURL,
    isMounted,
  ]);

  // Update URL when page or pageSize change (but not from filter changes)
  useEffect(() => {
    if (!isMounted || !isInitialMount.current) return;
    const pageChanged = prevPage.current !== currentPage;
    const pageSizeChanged = prevPageSize.current !== pageSize;

    if (pageChanged || pageSizeChanged) {
      prevPage.current = currentPage;
      prevPageSize.current = pageSize;
      updateURL({
        account: accountFilter,
        type: typeFilter,
        startDate,
        endDate,
        pageSize,
        page: currentPage,
        clearMember: accountFilter === "all",
      });
    }
  }, [
    currentPage,
    pageSize,
    accountFilter,
    typeFilter,
    startDate,
    endDate,
    updateURL,
    isMounted,
  ]);

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
  const transactions = useMemo(
    () => data?.transactions || [],
    [data?.transactions]
  );
  const totalTransactions = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Calculate inflow/outflow summary
  const _summary = useMemo(() => {
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
    setPageSize(25);
    setCurrentPage(1);
    // Clear all URL parameters - navigate to clean URL
    router.push(pathname, { scroll: false });
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
              ? `/dashboard/member/${account.username}`
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
              ? `/dashboard/member/${account.username}`
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
              onEdit={
                canWrite ? () => handleEditTransaction(transaction) : undefined
              }
            />
          );
        },
      },
    ],
    [canWrite]
  );

  // Table export functionality
  const {
    handleExportCsv,
    handleScreenshot,
    tableRef: _tableRef,
  } = useTableExport({
    tableName: "transactions",
    columns,
    data: transactions,
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6 pb-24 lg:pb-6">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <PageHeader
          title="Transaction History"
          subtitle={
            canWrite
              ? "Review all deposits, withdrawals, transfers, loans, and vendor movements."
              : "Read-only access. Contact admin to request write access."
          }
          primaryAction={
            canWrite
              ? {
                  label: "Add Transaction",
                  icon: <Receipt className="h-4 w-4" />,
                  onClick: handleAddTransaction,
                }
              : undefined
          }
          secondaryActions={[
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
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden space-y-2">
        <h1 className="text-xl font-semibold text-foreground">
          Transaction History
        </h1>
        <p className="text-sm text-muted-foreground">
          {canWrite
            ? "Review all deposits, withdrawals, transfers, loans, and vendor movements."
            : "Read-only access. Contact admin to request write access."}
        </p>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden lg:block">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search transactions..."
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
            onStartDateChange: (date) => {
              setStartDate(date);
              // If new start date is after end date, clear end date
              if (date && endDate && date > endDate) {
                setEndDate(undefined);
              }
            },
            onEndDateChange: (date) => {
              setEndDate(date);
              // If new end date is before start date, clear start date
              if (date && startDate && date < startDate) {
                setStartDate(undefined);
              }
            },
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
      <div className="lg:hidden flex items-center gap-2">
        {/* Search Bar */}
        <div className="flex-1">
          <SearchBarMobile
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search transactions..."
          />
        </div>

        {/* Filter Button */}
        <Button
          variant="outline"
          size="default"
          onClick={() => setFilterDrawerOpen(true)}
          className="gap-2 shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filter</span>
        </Button>
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
      {totalPages > 0 && (
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
        onStartDateChange={(date) => {
          setStartDate(date);
          // If new start date is after end date, clear end date
          if (date && endDate && date > endDate) {
            setEndDate(undefined);
          }
        }}
        endDate={endDate}
        onEndDateChange={(date) => {
          setEndDate(date);
          // If new end date is before start date, clear start date
          if (date && startDate && date < startDate) {
            setStartDate(undefined);
          }
        }}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        accountOptions={accountOptions}
        typeOptions={allTransactionTypeOptions}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Mobile FAB */}
      {canWrite && <FloatingActionButton onClick={handleAddTransaction} />}

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
