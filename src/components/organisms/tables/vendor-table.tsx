"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  AvatarCell,
  PlainTableHeader,
  ActionTableHeader,
  CommonTableCell,
  ActionCell,
} from "../../atoms/table-component";
import { dateFormat } from "@/lib/date";
import TableLayout from "../../atoms/table-layout";
import { vendorTypeMap } from "@/lib/config";
import { FilterBar } from "../../molecules/filter-bar-group";
import { VendorResponse } from "@/app/api/vendors/route";

const baseColumns: ColumnDef<VendorResponse>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ActionTableHeader label="Name" column={column} />,
    cell: ({ row }) => (
      <AvatarCell
        id={row.original.id}
        avatar={row.original.memberAvatar}
        name={row.original.name}
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
        className="min-w-[80px]"
      />
    ),
  },
  {
    accessorKey: "nextDueDate",
    header: ({ column }) => <ActionTableHeader label="Type" column={column} />,
    cell: ({ row }) => (
      <CommonTableCell
        label={
          row.original.active && row.original.nextDueDate
            ? dateFormat(new Date(row.original.nextDueDate))
            : "-"
        }
        subLabel={
          row.original.dueAmount
            ? row.original.dueAmount.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })
            : undefined
        }
        className="min-w-[50px]"
      />
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => <ActionTableHeader label="Type" column={column} />,
    cell: ({ row }) => (
      <CommonTableCell
        label={vendorTypeMap[row.original.type]}
        subLabel={
          row.original.nextDueDate
            ? `${row.original.currentTerm} / ${row.original.totalTerms} terms`
            : ""
        }
        className="min-w-[50px]"
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
        className="min-w-[80px]"
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
        className="min-w-[80px]"
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
            ? row.original.returns.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })
            : " - "
        }
        className="min-w-[80px]"
        greenLabel={row.original.calcReturns}
      />
    ),
  },
];

const editColumns: ColumnDef<VendorResponse>[] = [
  {
    accessorKey: "id",
    header: () => <PlainTableHeader label="ID" />,
    cell: ({ row }) => (
      <CommonTableCell label={row.original.id} className="min-w-[100px]" />
    ),
  },
];

export type VendorTableProps = {
  handleAction: (
    select: null | VendorResponse["vendor"],
    mode?: string,
  ) => void;
};

const VendorsTable = ({ handleAction }: VendorTableProps) => {
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<VendorResponse[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/vendors");
    const json = await res.json();
    setVendors(json.vendors);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = useMemo(() => {
    if (!editMode) {
      return baseColumns;
    }
    return [
      ...baseColumns,
      ...editColumns,
      {
        accessorKey: "vendor.id",
        header: () => <PlainTableHeader label="Action" />,
        cell: ({ row }) => (
          <ActionCell onClick={() => handleAction(row.original.vendor)} />
        ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  const table = useReactTable({
    data: vendors,
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
      <TableLayout table={table} columns={columns} isLoading={isLoading} />
    </div>
  );
};

export default VendorsTable;
