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
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TransformedTransaction } from "@/app/api/transaction/route";
import { DataTable } from "@/components/atoms/data-table";
import { FilterBar } from "@/components/atoms/filter-bar";
import { FilterChips } from "@/components/atoms/filter-chips";
import { PageHeader } from "@/components/atoms/page-header";
import { RowActionsMenu } from "@/components/atoms/row-actions-menu";
import { SearchBarMobile } from "@/components/atoms/search-bar-mobile";
import { TransactionFormDialog } from "@/components/molecules/transaction-form-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const { data, isLoading } = useQuery(fetchTransactions(queryOptions));

  // Use transactions directly from API (filtering is done server-side)
  const transactions = data?.transactions || [];

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
    console.log("View transaction", transaction);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setAccountFilter("all");
    setTypeFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
  };

  // Transaction type options for filter chips
  const transactionTypeOptions = [
    { label: "All Types", value: "all" },
    { label: "Deposit", value: "PERIODIC_DEPOSIT" },
    { label: "Withdrawal", value: "WITHDRAW" },
    { label: "Loan Taken", value: "LOAN_TAKEN" },
    { label: "Loan Repayment", value: "LOAN_REPAY" },
    { label: "Transfer", value: "FUNDS_TRANSFER" },
    { label: "Other", value: "other" },
  ];

  // Define columns
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
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={account.avatar} alt={account.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {account.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Link
                  href="#"
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {account.name}
                </Link>
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
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={account.avatar} alt={account.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {account.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Link
                  href="#"
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {account.name}
                </Link>
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
          const {
            direction,
            color,
            icon: Icon,
          } = getTransactionDirection(transaction);
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
        id: "occurred",
        accessorKey: "transactionAt",
        header: "Occurred",
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
        header: "Recorded",
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
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <PageHeader
          title="Transaction History"
          subtitle="Review all deposits, withdrawals, transfers, and loan movements."
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
      <div className="lg:hidden space-y-2 px-4 pt-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Transaction History
        </h1>
        <p className="text-sm text-muted-foreground">
          Review all deposits, withdrawals, transfers, and loan movements.
        </p>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden lg:block">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={{
            account: {
              value: accountFilter,
              onChange: setAccountFilter,
              options: [
                { label: "All Accounts", value: "all" },
                ...accounts.map((acc) => ({
                  label: acc.name,
                  value: acc.id,
                })),
              ],
            },
            type: {
              value: typeFilter,
              onChange: setTypeFilter,
              options: transactionTypeOptions,
            },
          }}
          onReset={handleResetFilters}
        />
      </div>

      {/* Summary */}
      {transactions.length > 0 && (
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Inflow:</span>
            <span className="font-medium text-green-600 dark:text-green-500">
              {moneyFormat(summary.inflow)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Outflow:</span>
            <span className="font-medium text-destructive">
              {moneyFormat(summary.outflow)}
            </span>
          </div>
        </div>
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
      <div className="lg:hidden space-y-6 px-4 pb-24">
        {/* Search Bar */}
        <SearchBarMobile
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search transactions..."
        />

        {/* Filter Chips */}
        <FilterChips
          chips={transactionTypeOptions.slice(0, 4).map((opt) => ({
            label: opt.label,
            value: opt.value,
          }))}
          selectedValue={typeFilter}
          onChange={setTypeFilter}
        />

        {/* Transaction List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const {
                direction,
                color,
                icon: Icon,
              } = getTransactionDirection(transaction);
              return (
                <div
                  key={transaction.id}
                  className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
                  onClick={() => handleEditTransaction(transaction)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={transaction.from.avatar}
                            alt={transaction.from.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {transaction.from.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">
                          {transaction.from.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-10">
                        <span className="text-xs text-muted-foreground">→</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={transaction.to.avatar}
                            alt={transaction.to.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {transaction.to.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">
                          {transaction.to.name}
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 ${color}`}>
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="text-base font-semibold">
                        {moneyFormat(transaction.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {transactionTypeMap[transaction.transactionType]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dateFormat(newZoneDate(transaction.transactionAt))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">
            No transactions found
          </div>
        )}
      </div>

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
