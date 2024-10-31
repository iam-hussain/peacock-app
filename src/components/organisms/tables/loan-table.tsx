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

import { TransformedLoan } from "@/app/api/loan/route";
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
        avatar={row.original.memberAvatar}
        name={row.original.name}
        avatarName={row.original.name}
        active={row.original.active}
        subLabel={"Loan"}
      />
    ),
  },
  {
    accessorKey: "account",
    header: ({ column }) => (
      <ActionTableHeader label="Account" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.account.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
        subLabel={
          row.original.account > 0
            ? dateFormat(new Date(row.original.startAt))
            : undefined
        }
      />
    ),
  },
  {
    accessorKey: "expected",
    header: ({ column }) => (
      <ActionTableHeader label="Expected" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={moneyFormat(row.original.expected)}
        subLabel={
          row.original.expectedMonth
            ? dateFormat(new Date(row.original.expectedMonth))
            : undefined
        }
      />
    ),
  },

  {
    accessorKey: "returns",
    header: ({ column }) => <ActionTableHeader label="Paid" column={column} />,
    cell: ({ row }) => (
      <CommonTableCell
        label={moneyFormat(row.original.returns || 0)}
      // greenLabel={row.original.returns > 0}
      />
    ),
  },
  {
    accessorKey: "balance",
    header: ({ column }) => (
      <ActionTableHeader label="Balance" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={moneyFormat(row.original.balance)}
        greenLabel={row.original.balance <= 0}
        redLabel={row.original.balance > 0}
      />
    ),
  },

  {
    accessorKey: "current",
    header: ({ column }) => (
      <ActionTableHeader label="Today Balance" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={moneyFormat(row.original.current)}
        subLabel={row.original.account > 0 ? dateFormat(new Date()) : undefined}
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
    data: data?.vendors || [],
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
