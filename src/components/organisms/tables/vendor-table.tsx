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
import React, { useMemo, useState } from "react";

import {
  ActionCell,
  ActionTableHeader,
  AvatarCell,
  CommonTableCell,
  PlainTableHeader,
} from "../../atoms/table-component";
import TableLayout from "../../atoms/table-layout";
import { FilterBar } from "../../molecules/filter-bar-group";

import { TransformedVendor } from "@/app/api/account/vendor/route";
import { dateFormat, newZoneDate } from "@/lib/core/date";
import { fetchVendors } from "@/lib/query-options";
import { moneyFormat } from "@/lib/ui/utils";

const baseColumns: ColumnDef<TransformedVendor>[] = [
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
      />
    ),
  },
  {
    accessorKey: "startAt",
    header: ({ column }) => (
      <ActionTableHeader label="Started At" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={
          row.original.startAt
            ? dateFormat(newZoneDate(row.original.startAt))
            : "N/A"
        }
        subLabel={
          row.original.endAt
            ? dateFormat(newZoneDate(row.original.endAt))
            : undefined
        }
      />
    ),
  },
  {
    accessorKey: "nextDueDate",
    header: ({ column }) => <ActionTableHeader label="Due" column={column} />,
    cell: ({ row }) => (
      <CommonTableCell
        label={
          row.original.active && row.original.nextDueDate
            ? dateFormat(row.original.nextDueDate)
            : "-"
        }
        subLabel={
          row.original.monthsPassedString && row.original.nextDueDate
            ? row.original.monthsPassedString
            : undefined
        }
      />
    ),
  },
  {
    accessorKey: "invest",
    header: ({ column }) => (
      <ActionTableHeader label="Invest" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.totalInvestment.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
      />
    ),
  },
  {
    accessorKey: "profit",
    header: ({ column }) => (
      <ActionTableHeader label="Return" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.totalReturns.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
      />
    ),
  },
  {
    accessorKey: "returns",
    header: ({ column }) => (
      <ActionTableHeader label="Profit" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={moneyFormat(row.original.totalProfitAmount)}
        greenLabel={row.original.totalProfitAmount > 0}
      />
    ),
  },
];

const editColumns: ColumnDef<TransformedVendor>[] = [
  {
    accessorKey: "id",
    header: () => <PlainTableHeader label="ID" />,
    cell: ({ row }) => (
      <CommonTableCell label={row.original.id} className="min-w-[100px]" />
    ),
  },
];

export type VendorTableProps = {
  // eslint-disable-next-line unused-imports/no-unused-vars
  handleAction: (select: null | TransformedVendor["account"]) => void;
};

const VendorsTable = ({ handleAction }: VendorTableProps) => {
  const [editMode, setEditMode] = useState(false);
  const { data, isLoading, isError } = useQuery(fetchVendors());

  const actionColumn = {
    accessorKey: "action",
    header: () => <PlainTableHeader label="Action" />,
    cell: ({ row }: any) => (
      <ActionCell onClick={() => handleAction(row.original.account)} />
    ),
  };

  const columns = useMemo(() => {
    if (!editMode) {
      return [...baseColumns, actionColumn];
    }
    return [...baseColumns, ...editColumns, actionColumn];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

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
      <FilterBar
        searchValue={
          (table.getColumn("name")?.getFilterValue() as string) ?? ""
        }
        onSearchChange={(value) =>
          table.getColumn("name")?.setFilterValue(value)
        }
        onToggleChange={setEditMode}
        toggleState={editMode}
        onAddClick={() => handleAction(null)}
      />
      <TableLayout
        table={table}
        columns={columns}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
};

export default VendorsTable;
