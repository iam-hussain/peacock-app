"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import {
  Camera,
  Download,
  FolderSync,
  MoreHorizontal,
  Pin,
  PinOff,
} from "lucide-react";
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
import { fetchLoans } from "@/lib/query-options";
import { moneyFormat } from "@/lib/ui/utils";
import { TransformedLoan } from "@/transformers/account";

export default function LoansPage() {
  const { data, isLoading } = useQuery(fetchLoans());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [stickyEnabled, setStickyEnabled] = useState(true);

  // Determine loan status
  const getLoanStatus = (loan: TransformedLoan) => {
    if (loan.totalLoanBalance > 0) {
      return { label: "Active", color: "bg-blue-500" };
    }
    if (loan.totalInterestBalance > 0) {
      return { label: "Pending", color: "bg-red-500" };
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
          l.username.toLowerCase().includes(query)
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
    window.location.href = `/dashboard/transaction?member=${loan.username}&type=LOAN_ALL`;
  };

  const handleChangePassword = () => {
    window.location.href = "/dashboard/profile";
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
              <ClickableAvatar
                src={loan.avatar}
                alt={loan.name}
                name={loan.name}
                href={loan.link}
                size="md"
              />
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
          columnClassName: "min-w-[10rem] whitespace-nowrap",
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
                <div className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                  {duration}
                </div>
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
          const amount = row.original.totalLoanBalance || 0;
          return (
            <div className="text-right text-sm font-medium text-foreground">
              {moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "interestPaid",
        accessorKey: "totalInterestPaid",
        header: "Interest Paid",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Total interest paid by this member.",
        },
        cell: ({ row }) => {
          const amount = row.original.totalInterestPaid || 0;
          return (
            <div className="text-right text-sm font-medium text-green-600 dark:text-green-500">
              {moneyFormat(amount)}
            </div>
          );
        },
      },
      {
        id: "interestOutstanding",
        accessorKey: "totalInterestBalance",
        header: "Int. Pending",
        enableSorting: true,
        meta: {
          align: "right",
          tooltip: "Remaining interest amount to be paid.",
          columnClassName: "w-[7rem] max-w-[7rem]",
        },
        cell: ({ row }) => {
          const amount = row.original.totalInterestBalance || 0;
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
              onViewTransactions={() => handleAddRepayment(loan)}
              onChangePassword={handleChangePassword}
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
    tableName: "loans",
    columns,
    data: filteredLoans,
    title: "Loans",
  });

  return (
    <PageTransition>
      <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6 pb-20 lg:pb-6">
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
          searchPlaceholder="Search loans..."
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

        <div ref={tableRef}>
          <DataTable
            columns={columns}
            data={filteredLoans}
            frozenColumnKey="member"
            isLoading={isLoading}
            sticky={stickyEnabled}
          />
        </div>

        <ScreenshotArea
          title="Loans"
          capturedAt={capturedAt}
          identifier={identifier}
        >
          <div style={{ width: "100%", minWidth: 1200 }}>
            <DesktopTableOnly
              columns={columns.filter((col) => col.id !== "actions")}
              data={filteredLoans}
              frozenColumnKey="member"
            />
          </div>
        </ScreenshotArea>
      </div>
    </PageTransition>
  );
}
