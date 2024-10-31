"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import React, { useMemo, useState } from "react";

import { DatePickerGroup } from "../../atoms/date-picker-group";
import { SelectInputGroup } from "../../atoms/select-input-group";
import {
  ActionCell,
  ActionTableHeader,
  AvatarCell,
  CommonTableCell,
  PaginationControls,
  PlainTableHeader,
} from "../../atoms/table-component";
import TableLayout from "../../atoms/table-layout";
import { PaginationFilters } from "../../molecules/pagination-filters";

import { TransformedMemberSelect } from "@/app/api/member/select/route";
import { TransformedTransaction } from "@/app/api/transaction/route";
import { TransformedVendorSelect } from "@/app/api/vendor/select/route";
import { Dialog } from "@/components/ui/dialog";
import { transactionMethodMap, transactionTypeMap } from "@/lib/config";
import { fetchTransactions } from "@/lib/query-options";

const baseColumns = (
  handleSortClick: (id: string) => void
): ColumnDef<TransformedTransaction>[] => [
  {
    accessorKey: "from.name",
    header: () => <PlainTableHeader label="From" />,
    cell: ({ row }) => (
      <AvatarCell
        id={row.original.from.id}
        avatar={row.original.from.avatar}
        name={row.original.from.name}
        active={row.original.from.active}
        subLabel={row.original.from.sub}
      />
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <ActionTableHeader
        onClick={handleSortClick}
        label="Amount"
        column={column}
      />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.amount.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
      />
    ),
  },
  {
    accessorKey: "to.name",
    header: () => <PlainTableHeader label="To" />,
    cell: ({ row }) => (
      <AvatarCell
        id={row.original.to.id}
        avatar={row.original.to.avatar}
        name={row.original.to.name}
        active={row.original.to.active}
        subLabel={row.original.to.sub}
      />
    ),
  },
  {
    accessorKey: "transactionType",
    header: ({ column }) => (
      <ActionTableHeader
        onClick={handleSortClick}
        label="Type"
        column={column}
      />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={transactionTypeMap[row.original.transactionType]}
        subLabel={transactionMethodMap[row.original.method]}
      />
    ),
  },
  {
    accessorKey: "transactionAt",
    header: ({ column }) => (
      <ActionTableHeader
        onClick={handleSortClick}
        label="Transaction At"
        column={column}
      />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={format(
          new Date(row.original.transactionAt),
          "dd MMM yyyy hh:mm a"
        )}
      />
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <ActionTableHeader
        column={column}
        onClick={handleSortClick}
        label="Created At"
      />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={format(new Date(row.original.createdAt), "dd MMM yyyy hh:mm a")}
        subLabel={
          row.original.updatedAt !== row.original.createdAt
            ? format(new Date(row.original.updatedAt), "dd MMM yyyy hh:mm a")
            : undefined
        }
      />
    ),
  },
];

const editColumns = (
  handleSortClick: (id: string) => void
): ColumnDef<TransformedTransaction>[] => [
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <ActionTableHeader
        column={column}
        onClick={handleSortClick}
        label="Updated At"
      />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={format(
          new Date(row.original.updatedAt || row.original.createdAt),
          "dd MMM yyyy hh:mm a"
        )}
      />
    ),
  },
  {
    accessorKey: "id",
    header: () => <PlainTableHeader label="ID" />,
    cell: ({ row }) => (
      <CommonTableCell label={row.original.id} className="min-w-[100px]" />
    ),
  },
];

const initialOptions = {
  vendorId: "",
  memberId: "",
  transactionType: "",
  startDate: undefined,
  endDate: undefined,
  limit: 10,
  page: 1,
  sortField: "transactionAt",
  sortOrder: "desc",
};

export type MembersTransactionTableProps = {
  members: TransformedMemberSelect[];
  vendors: TransformedVendorSelect[];
  handleAction: (select: null | TransformedTransaction) => void;
};

const TransactionTable = ({
  members,
  vendors,
  handleAction,
}: MembersTransactionTableProps) => {
  const [editMode, setEditMode] = useState(false);
  const [options, setOptions] = useState<any>(initialOptions);

  const { data, isLoading, isError } = useQuery(fetchTransactions(options));

  const handleOptionsReset = () => {
    setOptions(initialOptions);
  };

  const handleSortClick = (id: string) => {
    setOptions((item: any) => ({
      ...item,
      sortField: id,
      sortOrder: item.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const actionColumn = {
    accessorKey: "action",
    header: () => <PlainTableHeader label="Action" />,
    cell: ({ row }: any) => (
      <ActionCell onClick={() => handleAction(row.original)} />
    ),
  };

  const columns = useMemo(() => {
    if (!editMode) {
      return [...baseColumns(handleSortClick), actionColumn];
    }
    return [
      ...baseColumns(handleSortClick),
      ...editColumns(handleSortClick),
      actionColumn,
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  const table = useReactTable({
    data: data?.transactions || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: data?.totalPages || 0,
    state: {
      pagination: { pageIndex: options.page - 1, pageSize: 10 },
      sorting: [{ id: options.sortField, desc: options.sortOrder === "desc" }],
    },
  });

  return (
    <Dialog>
      <div className="w-full">
        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full mb-4">
          <SelectInputGroup
            value={options.vendorId}
            onChange={(e) => setOptions({ ...options, vendorId: e, page: 1 })}
            placeholder="Select VENDOR"
            options={vendors.map((each) => [each.id, each.name])}
          />

          <SelectInputGroup
            value={options.memberId}
            onChange={(e) => setOptions({ ...options, memberId: e, page: 1 })}
            placeholder="Select MEMBER"
            options={members.map((each) => [each.id, each.name])}
          />

          <DatePickerGroup
            selectedDate={options.startDate}
            onSelectDate={(e) =>
              setOptions({ ...options, startDate: e, page: 1 })
            }
            placeholder={"Date FROM"}
          />

          <DatePickerGroup
            selectedDate={options.endDate}
            onSelectDate={(e) =>
              setOptions({ ...options, endDate: e, page: 1 })
            }
            placeholder={"Date TO"}
          />

          <SelectInputGroup
            value={options.transactionType}
            onChange={(e) =>
              setOptions({ ...options, transactionType: e, page: 1 })
            }
            placeholder="Select TYPE"
            options={Object.entries(transactionTypeMap)}
          />
          <PaginationFilters
            limit={Number(options.limit)}
            onLimitChange={(limit: any) =>
              setOptions({ ...options, limit, page: 1 })
            }
            onToggleChange={setEditMode}
            toggleState={editMode}
          />
        </div>

        <TableLayout
          table={table}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
        />
        <PaginationControls
          page={options.page}
          totalPages={data?.totalPages || 0}
          isLoading={isLoading}
          isError={isError}
          setPage={(page) => setOptions({ ...options, page })}
        />
      </div>
    </Dialog>
  );
};

export default TransactionTable;
