"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo } from "react";
import { LuView } from "react-icons/lu";

import {
  ActionTableHeader,
  AvatarCell,
  CommonTableCell,
  PlainTableHeader,
} from "../../atoms/table-component";
import TableLayout from "../../atoms/table-layout";

import { TransformedLoan } from "@/app/api/account/loan/route";
import { Button } from "@/components/ui/button";
import { dateFormat } from "@/lib/date";
import { fetchLoans } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";

const baseColumns: ColumnDef<TransformedLoan>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ActionTableHeader label="Name" column={column} />,
    cell: ({ row }) => (
      <AvatarCell
        id={row.original.id}
        avatar={row.original.avatar}
        name={row.original.name}
        avatarName={row.original.name}
        active={row.original.active}
        subLabel={"Loan"}
      />
    ),
  },
  {
    accessorKey: "recentLoanTakenDate",
    header: ({ column }) => <ActionTableHeader label="From" column={column} />,
    cell: ({ row }) => (
      <CommonTableCell
        label={
          row.original.totalLoanBalance > 0 && row.original.recentLoanTakenDate
            ? dateFormat(new Date(row.original.recentLoanTakenDate))
            : "-"
        }
        subLabel={
          row.original.totalLoanBalance > 0 && row.original.recentPassedString
            ? row.original.recentPassedString
            : undefined
        }
      />
    ),
  },
  {
    accessorKey: "totalLoanBalance",
    header: ({ column }) => (
      <ActionTableHeader label="Loan Amount" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.totalLoanBalance.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
        greenLabel={row.original.totalLoanBalance > 0}
      />
    ),
  },
  {
    accessorKey: "totalInterestAmount",
    header: ({ column }) => (
      <ActionTableHeader label="Total / Paid" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={moneyFormat(row.original.totalInterestAmount)}
        subLabel={moneyFormat(row.original.totalInterestPaid)}
      />
    ),
  },
  {
    accessorKey: "totalInterestBalance",
    header: ({ column }) => (
      <ActionTableHeader label="Balance" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={moneyFormat(row.original.totalInterestBalance)}
        greenLabel={row.original.totalInterestBalance <= 0}
        redLabel={row.original.totalInterestBalance > 0}
      />
    ),
  },
];

export type LoanTableProps = {
  // eslint-disable-next-line unused-imports/no-unused-vars
  handleAction: (select: null | TransformedLoan) => void;
};

const LoanTable = ({ handleAction }: LoanTableProps) => {
  const { data, isLoading, isError } = useQuery(fetchLoans());

  const columns = useMemo(() => {
    return [
      ...baseColumns,
      {
        accessorKey: "action",
        header: () => <PlainTableHeader label="Details" />,
        cell: ({ row }) => (
          <Button
            variant={"ghost"}
            className="px-3 py-1"
            onClick={() => handleAction(row.original)}
          >
            <LuView className="h-4 w-4" />
          </Button>
        ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const table = useReactTable({
    data: data?.accounts || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: 1,
    state: {
      pagination: { pageIndex: 0, pageSize: 50 },
    },
  });

  return (
    <div className="w-full">
      <TableLayout
        table={table}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
};

export default LoanTable;
