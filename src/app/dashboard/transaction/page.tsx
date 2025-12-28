"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";

import { TransformedTransaction } from "@/app/api/transaction/route";
import { GetTransactionResponse } from "@/app/api/transaction/route";
import { ClickableAvatar } from "@/components/atoms/clickable-avatar";
import { DataTable } from "@/components/atoms/data-table";
import { DesktopTableOnly } from "@/components/atoms/desktop-table-only";
import { FilterBar } from "@/components/atoms/filter-bar";
import { PageHeader } from "@/components/atoms/page-header";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import { SearchBarMobile } from "@/components/atoms/search-bar-mobile";
import { FloatingActionButton } from "@/components/molecules/floating-action-button";
import { PaginationControls } from "@/components/molecules/pagination-controls";
import { ScreenshotArea } from "@/components/molecules/screenshot-area";
import { TransactionCardMobile } from "@/components/molecules/transaction-card-mobile";
import { TransactionFilterDrawer } from "@/components/molecules/transaction-filter-drawer";
import { TransactionFormDialog } from "@/components/molecules/transaction-form-dialog";
import { TransactionDeleteForm } from "@/components/organisms/forms/transaction-delete-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useTableExport } from "@/hooks/use-table-export";
import { transactionTypeMap } from "@/lib/config/config";
import { dateFormat, newZoneDate } from "@/lib/core/date";
import fetcher from "@/lib/core/fetcher";
import { fetchAccountSelect, fetchTransactions } from "@/lib/query-options";
import { moneyFormat } from "@/lib/ui/utils";

export default function TransactionsPage() {
  const queryClient = useQueryClient();
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransformedTransaction | null>(null);
  const [selectedTransactionForDelete, setSelectedTransactionForDelete] =
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
      search?: string | null;
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

      // Handle date filters with short YYYY-MM-DD strings
      const formatDateParam = (date?: Date | null) =>
        date ? date.toISOString().slice(0, 10) : null;

      if ("startDate" in updates) {
        const val = formatDateParam(updates.startDate);
        if (val) params.set("startDate", val);
        else params.delete("startDate");
      } else {
        const existingStartDate = searchParams.get("startDate");
        if (existingStartDate) params.set("startDate", existingStartDate);
      }

      if ("endDate" in updates) {
        const val = formatDateParam(updates.endDate);
        if (val) params.set("endDate", val);
        else params.delete("endDate");
      } else {
        const existingEndDate = searchParams.get("endDate");
        if (existingEndDate) params.set("endDate", existingEndDate);
      }

      // Handle page size - always include in URL
      if (updates.pageSize !== undefined) {
        params.set("pageSize", updates.pageSize.toString());
      } else {
        const existingPageSize = searchParams.get("pageSize");
        if (existingPageSize) {
          params.set("pageSize", existingPageSize);
        } else {
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
          params.set("page", "1");
        }
      }

      // Handle search
      if (updates.search !== undefined) {
        if (updates.search && updates.search.trim().length > 0) {
          params.set("q", updates.search.trim());
        } else {
          params.delete("q");
        }
      } else {
        const existingSearch = searchParams.get("q");
        if (existingSearch) {
          params.set("q", existingSearch);
        }
      }

      const newURL = `${pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      router.push(newURL, { scroll: false });
    },
    [pathname, router, searchParams, accounts]
  );

  // Read initial values from URL on mount (only on client)
  useEffect(() => {
    if (!isMounted) return;
    if (isInitialMount.current && accounts.length > 0) {
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

      const typeParam = searchParams.get("type");
      if (typeParam) {
        setTypeFilter(typeParam);
      }

      const startDateParam = searchParams.get("startDate");
      if (startDateParam) {
        setStartDate(new Date(startDateParam));
      }
      const endDateParam = searchParams.get("endDate");
      if (endDateParam) {
        setEndDate(new Date(endDateParam));
      }

      const pageSizeParam = searchParams.get("pageSize");
      if (pageSizeParam) {
        setPageSize(parseInt(pageSizeParam, 10));
      }

      const pageParam = searchParams.get("page");
      if (pageParam) {
        setCurrentPage(parseInt(pageParam, 10));
      }

      const searchParam = searchParams.get("q");
      if (searchParam) {
        setSearchQuery(searchParam);
      }

      isInitialMount.current = false;
    }
  }, [searchParams, accounts, isMounted]);

  const prevFilters = useRef({
    accountFilter,
    typeFilter,
    startDate,
    endDate,
    searchQuery,
  });
  const prevPage = useRef(currentPage);
  const prevPageSize = useRef(pageSize);

  useEffect(() => {
    if (!isMounted || isInitialMount.current) return;
    const filtersChanged =
      prevFilters.current.accountFilter !== accountFilter ||
      prevFilters.current.typeFilter !== typeFilter ||
      prevFilters.current.startDate?.getTime() !== startDate?.getTime() ||
      prevFilters.current.endDate?.getTime() !== endDate?.getTime() ||
      prevFilters.current.searchQuery !== searchQuery;

    if (filtersChanged) {
      setCurrentPage(1);
      prevFilters.current = {
        accountFilter,
        typeFilter,
        startDate,
        endDate,
        searchQuery,
      };
      updateURL({
        account: accountFilter,
        type: typeFilter,
        startDate,
        endDate,
        pageSize,
        page: 1,
        clearMember: accountFilter === "all",
        search: searchQuery,
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
    searchQuery,
  ]);

  useEffect(() => {
    if (!isMounted || isInitialMount.current) return;
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
        search: searchQuery,
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
    searchQuery,
  ]);

  const queryOptions = useMemo(
    () => ({
      accountId: accountFilter === "all" ? "" : accountFilter,
      transactionType: typeFilter === "all" ? "" : typeFilter,
      startDate: startDate ? startDate.toISOString().slice(0, 10) : undefined,
      endDate: endDate ? endDate.toISOString().slice(0, 10) : undefined,
      limit: pageSize === 0 ? 10000 : pageSize, // 0 means show all (use large limit)
      page: currentPage,
      search: searchQuery.trim(),
      sortField: "occurredAt",
      sortOrder: "desc" as const,
    }),
    [
      accountFilter,
      typeFilter,
      startDate,
      endDate,
      pageSize,
      currentPage,
      searchQuery,
    ]
  );

  const { data, isLoading, isError } = useQuery(
    fetchTransactions(queryOptions)
  );

  const transactions = useMemo(
    () => data?.transactions || [],
    [data?.transactions]
  );
  const totalTransactions = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const _summary = useMemo(() => {
    let inflow = 0;
    let outflow = 0;

    transactions.forEach((t) => {
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
      } else if (
        ["WITHDRAW", "VENDOR_INVEST", "LOAN_TAKEN"].includes(t.transactionType)
      ) {
        outflow += t.amount;
      }
    });

    return { inflow, outflow };
  }, [transactions]);

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

  const handleDeleteTransaction = (transaction: TransformedTransaction) => {
    setSelectedTransactionForDelete(transaction);
    setDeleteDialogOpen(true);
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
    setCurrentPage(1);
  };

  const allTransactionTypeOptions = [
    { label: "All Types", value: "all" },
    { label: "All Loan Activity", value: "LOAN_ALL" },
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

  const accountOptions = [
    { label: "All Accounts", value: "all" },
    ...accounts.map((acc) => ({
      label: acc.name || acc.username || acc.id,
      value: acc.id,
    })),
  ];

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
            (account.type === "MEMBER"
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
            (account.type === "MEMBER"
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
        cell: ({ row }) => (
          <div className="text-sm text-foreground">
            {transactionTypeMap[row.original.transactionType]}
          </div>
        ),
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
        accessorKey: "occurredAt",
        header: "Transaction At",
        enableSorting: true,
        meta: {
          tooltip: "When this transaction actually happened.",
        },
        cell: ({ row }) => (
          <div className="text-sm text-foreground">
            {dateFormat(newZoneDate(row.original.occurredAt))}
          </div>
        ),
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
              onDelete={
                canWrite
                  ? () => handleDeleteTransaction(transaction)
                  : undefined
              }
            />
          );
        },
      },
    ],
    [canWrite]
  );

  // Fetch all transactions for CSV export (without pagination)
  const fetchAllTransactionsForExport = useCallback(async () => {
    // Fetch all pages of data by making multiple requests if needed
    // First, get the total count with current filters
    const firstPageOptions = {
      accountId: accountFilter === "all" ? "" : accountFilter,
      transactionType: typeFilter === "all" ? "" : typeFilter,
      startDate: startDate ? startDate.toISOString().slice(0, 10) : undefined,
      endDate: endDate ? endDate.toISOString().slice(0, 10) : undefined,
      limit: 1000, // Fetch 1000 at a time
      page: 1,
      sortField: "occurredAt",
      sortOrder: "desc" as const,
    };

    const params = new URLSearchParams({
      page: firstPageOptions.page.toString(),
      limit: firstPageOptions.limit.toString(),
      accountId: firstPageOptions.accountId.trim(),
      transactionType: firstPageOptions.transactionType.trim(),
      sortField: firstPageOptions.sortField,
      sortOrder: firstPageOptions.sortOrder,
      ...(firstPageOptions.startDate
        ? { startDate: firstPageOptions.startDate }
        : {}),
      ...(firstPageOptions.endDate
        ? { endDate: firstPageOptions.endDate }
        : {}),
    });

    const firstResponse = (await fetcher.post(
      `/api/transaction?${params.toString()}`
    )) as unknown as GetTransactionResponse;

    let allTransactions = [...firstResponse.transactions];
    const totalPages = firstResponse.totalPages;

    // Fetch remaining pages if any
    if (totalPages > 1) {
      const remainingPages = Array.from(
        { length: totalPages - 1 },
        (_, i) => i + 2
      );
      const remainingResponses = await Promise.all(
        remainingPages.map(async (page) => {
          const pageParams = new URLSearchParams({
            page: page.toString(),
            limit: firstPageOptions.limit.toString(),
            accountId: firstPageOptions.accountId.trim(),
            transactionType: firstPageOptions.transactionType.trim(),
            sortField: firstPageOptions.sortField,
            sortOrder: firstPageOptions.sortOrder,
            ...(firstPageOptions.startDate
              ? { startDate: firstPageOptions.startDate }
              : {}),
            ...(firstPageOptions.endDate
              ? { endDate: firstPageOptions.endDate }
              : {}),
          });
          return fetcher.post(
            `/api/transaction?${pageParams.toString()}`
          ) as unknown as GetTransactionResponse;
        })
      );

      remainingResponses.forEach((response) => {
        allTransactions = [...allTransactions, ...response.transactions];
      });
    }

    // Apply search filter client-side if search query exists
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      allTransactions = allTransactions.filter((tx) => {
        const fromName = tx.from?.name?.toLowerCase() || "";
        const toName = tx.to?.name?.toLowerCase() || "";
        const type = tx.transactionType?.toLowerCase() || "";
        const amount = tx.amount?.toString() || "";
        return (
          fromName.includes(searchLower) ||
          toName.includes(searchLower) ||
          type.includes(searchLower) ||
          amount.includes(searchLower)
        );
      });
    }

    return allTransactions;
  }, [accountFilter, typeFilter, startDate, endDate, searchQuery]);

  // Helper function to escape CSV values
  const escapeCsvValue = useCallback((value: unknown): string => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (/[,"\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }, []);

  const { handleScreenshot, tableRef, capturedAt, identifier } = useTableExport(
    {
      tableName: "transactions",
      columns,
      data: transactions,
      title: "Transactions",
    }
  );

  // Custom CSV export handler that fetches all data
  const handleExportCsv = useCallback(async () => {
    try {
      toast.loading("Fetching all transactions for export...", {
        id: "csv-export",
      });

      // Fetch all transactions
      const allTransactions = await fetchAllTransactionsForExport();

      // Filter out action columns
      const dataColumns = columns.filter((col) => {
        const header =
          typeof col.header === "string" ? col.header : col.id || "Column";
        const isActionColumn =
          header.toLowerCase().includes("action") ||
          col.id === "actions" ||
          (col.meta as any)?.tooltip?.toLowerCase().includes("action");
        return !isActionColumn;
      });

      // Build CSV content
      const csvRows: string[] = [];

      // Add headers
      const headers = dataColumns.map((col) => {
        const header =
          typeof col.header === "string"
            ? col.header
            : ((col.meta as any)?.tooltip?.split(".")[0] ?? col.id ?? "Column");
        return escapeCsvValue(header);
      });
      csvRows.push(headers.join(","));

      // Add data rows
      allTransactions.forEach((row: TransformedTransaction) => {
        const values = dataColumns.map((col) => {
          const accessorKey =
            "accessorKey" in col ? (col.accessorKey as string) : undefined;
          let value: any = undefined;

          if (accessorKey) {
            const keys = String(accessorKey).split(".");
            value = row as any;
            for (const key of keys) {
              value = value?.[key];
              if (value === undefined || value === null) break;
            }
          } else if (col.id) {
            // Handle special cases for column IDs
            if (col.id === "type") {
              // Use the mapped transaction type name
              value =
                transactionTypeMap[row.transactionType] || row.transactionType;
            } else if (col.id === "amount") {
              // Format amount as currency string
              value = moneyFormat(row.amount);
            } else if (col.id === "occurredAt") {
              // Format date
              value = dateFormat(newZoneDate(row.occurredAt));
            } else if (col.id === "from") {
              value = row.from?.name || "";
            } else if (col.id === "to") {
              value = row.to?.name || "";
            } else {
              value = (row as any)[col.id];
            }
          }

          if (value === null || value === undefined) return "";
          if (typeof value === "number") return String(value);
          if (value instanceof Date) return dateFormat(newZoneDate(value));
          if (typeof value === "object" && value !== null) {
            if ("name" in value) return String(value.name);
            if ("label" in value) return String(value.label);
            if ("value" in value) return String(value.value);
            return JSON.stringify(value);
          }
          return String(value);
        });
        csvRows.push(values.map((v) => escapeCsvValue(v)).join(","));
      });

      // Create CSV blob
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 19).replace(/:/g, "-");
      link.download = `peacock-club-transactions-${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allTransactions.length} transactions to CSV`, {
        id: "csv-export",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV", { id: "csv-export" });
    }
  }, [columns, fetchAllTransactionsForExport, escapeCsvValue]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6 pb-24 lg:pb-6">
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

      <div className="lg:hidden">
        <PageHeader
          title="Transaction History"
          subtitle={
            canWrite
              ? "Review all deposits, withdrawals, transfers, loans, and vendor movements."
              : "Read-only access. Contact admin to request write access."
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
              if (date && endDate && date > endDate) {
                setEndDate(undefined);
              }
            },
            onEndDateChange: (date) => {
              setEndDate(date);
              if (date && startDate && date < startDate) {
                setStartDate(undefined);
              }
            },
          }}
          pageSize={{
            value: pageSize,
            onChange: setPageSize,
            options: [0, 25, 50, 75, 100],
          }}
          onReset={handleResetFilters}
        />
      </div>

      <div className="lg:hidden flex items-center gap-2">
        <div className="flex-1">
          <SearchBarMobile
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search transactions..."
          />
        </div>
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

      {/* Desktop Table View - Also used for mobile screenshots */}
      <div ref={tableRef} className="hidden lg:block">
        <DataTable
          columns={columns}
          data={transactions}
          frozenColumnKey="from"
          isLoading={isLoading}
        />
      </div>

      {/* Screenshot Area - Hidden, only for export */}
      <ScreenshotArea
        title="Transactions"
        capturedAt={capturedAt}
        identifier={identifier}
      >
        <div style={{ width: "100%", minWidth: 1400 }}>
          <DesktopTableOnly
            columns={columns.filter((col) => col.id !== "actions")}
            data={transactions}
            frozenColumnKey="from"
          />
        </div>
      </ScreenshotArea>

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
                onEdit={() => handleEditTransaction(transaction)}
                onDelete={() => handleDeleteTransaction(transaction)}
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
          if (date && endDate && date > endDate) {
            setEndDate(undefined);
          }
        }}
        endDate={endDate}
        onEndDateChange={(date) => {
          setEndDate(date);
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

      {canWrite && <FloatingActionButton onClick={handleAddTransaction} />}

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selected={selectedTransaction}
        accounts={accounts}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedTransactionForDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
          </DialogHeader>
          {selectedTransactionForDelete && (
            <TransactionDeleteForm
              transaction={selectedTransactionForDelete}
              onSuccess={async () => {
                setDeleteDialogOpen(false);
                setSelectedTransactionForDelete(null);
                await queryClient.invalidateQueries({
                  queryKey: ["all", "transaction"],
                });
              }}
              onCancel={() => {
                setDeleteDialogOpen(false);
                setSelectedTransactionForDelete(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
