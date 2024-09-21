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

import { TransformedVendor } from "@/app/api/vendor/route";
import { vendorTypeMap } from "@/lib/config";
import { dateFormat } from "@/lib/date";
import { fetchVendors } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";

const baseColumns: ColumnDef<TransformedVendor>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ActionTableHeader label="Name" column={column} />,
    cell: ({ row }) => (
      <AvatarCell
        id={row.original.id}
        avatar={row.original.memberAvatar}
        name={row.original.vendorName}
        avatarName={row.original.name}
        active={row.original.active}
        subLabel={row.original.memberName}
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
        label={dateFormat(new Date(row.original.startAt))}
        subLabel={
          row.original.endAt
            ? dateFormat(new Date(row.original.endAt))
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
            ? dateFormat(new Date(row.original.nextDueDate))
            : "-"
        }
        subLabel={
          row.original.balanceAmount
            ? moneyFormat(row.original.balanceAmount)
            : ""
        }
      />
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => <ActionTableHeader label="Type" column={column} />,
    cell: ({ row }) => (
      <CommonTableCell
        label={vendorTypeMap[row.original.type]}
        subLabel={row.original.period || ""}
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
        label={row.original.invest.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
      />
    ),
  },
  {
    accessorKey: "profit",
    header: ({ column }) => (
      <ActionTableHeader label="Profit" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.profit.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
      />
    ),
  },
  {
    accessorKey: "returns",
    header: ({ column }) => (
      <ActionTableHeader label="Return" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={
          row.original.calcReturns || row.original.type === "LEND"
            ? moneyFormat(row.original.returns)
            : " - "
        }
        greenLabel={row.original.calcReturns}
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
  handleAction: (select: null | TransformedVendor["vendor"]) => void;
};

const VendorsTable = ({ handleAction }: VendorTableProps) => {
  const [editMode, setEditMode] = useState(false);
  const { data, isLoading, isError } = useQuery(fetchVendors());

  const columns = useMemo(() => {
    if (!editMode) {
      return baseColumns;
    }
    return [
      ...baseColumns,
      ...editColumns,
      {
        accessorKey: "action",
        header: () => <PlainTableHeader label="Action" />,
        cell: ({ row }) => (
          <ActionCell onClick={() => handleAction(row.original.vendor)} />
        ),
      },
    ];
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
