"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
} from "@tanstack/react-table";

import { Dialog } from "@/components/ui/dialog";
import {
  AvatarCell,
  PlainTableHeader,
  CommonTableCell,
  PaginationControls,
  ActionTableHeader,
  ActionCell,
} from "../../atoms/table-component";
import TableLayout from "../../atoms/table-layout";
import { TransformedMemberTransaction } from "@/app/api/member/transaction/route";
import { memberTransactionTypeMap, transactionMethodMap } from "@/lib/config";
import { format } from "date-fns";
import { SelectInputGroup } from "../../atoms/select-input-group";
import { DatePickerGroup } from "../../atoms/date-picker-group";
import { PaginationFilters } from "../../molecules/pagination-filters";
import { useQuery } from "@tanstack/react-query";
import { fetchMemberTransactions } from "@/lib/query-options";
import { TransformedMemberSelect } from "@/app/api/member/select/route";

const baseColumns = (
  handleSortClick: (id: string) => void,
): ColumnDef<TransformedMemberTransaction>[] => [
  {
    accessorKey: "from.name",
    header: () => <PlainTableHeader label="From" />,
    cell: ({ row }) => (
      <AvatarCell
        id={row.original.from.id}
        avatar={row.original.from.avatar}
        name={row.original.from.name}
        active={row.original.from.active}
      />
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <ActionTableHeader
        column={column}
        onClick={handleSortClick}
        label="Amount"
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
      />
    ),
  },
  {
    accessorKey: "transactionType",
    header: ({ column }) => (
      <ActionTableHeader
        column={column}
        onClick={handleSortClick}
        label="Type"
      />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={memberTransactionTypeMap[row.original.transactionType]}
        subLabel={transactionMethodMap[row.original.method]}
      />
    ),
  },
  {
    accessorKey: "transactionAt",
    header: ({ column }) => (
      <ActionTableHeader
        column={column}
        onClick={handleSortClick}
        label="Transaction At"
      />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={format(
          new Date(row.original.transactionAt),
          "dd MMM yyyy hh:mm a",
        )}
      />
    ),
  },
];

const editColumns: ColumnDef<TransformedMemberTransaction>[] = [
  {
    accessorKey: "updatedAt",
    header: () => <PlainTableHeader label="Updated / Created" />,
    cell: ({ row }) => (
      <CommonTableCell
        label={format(new Date(row.original.updatedAt), "dd MMM yyyy hh:mm a")}
        subLabel={format(
          new Date(row.original.createdAt),
          "dd MMM yyyy hh:mm a",
        )}
      />
    ),
  },
  {
    accessorKey: "id",
    header: () => <PlainTableHeader label="ID" />,
    cell: ({ row }) => <CommonTableCell label={row.original.id} />,
  },
];

const initialOptions = {
  fromId: "",
  toId: "",
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
  handleAction: (select: null | TransformedMemberTransaction) => void;
};

const MembersTransactionTable = ({
  members,
  handleAction,
}: MembersTransactionTableProps) => {
  const [editMode, setEditMode] = useState(false);
  const [options, setOptions] = useState<any>(initialOptions);

  const { data, isLoading, isError } = useQuery(
    fetchMemberTransactions(options),
  );

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

  const columns = useMemo(() => {
    if (!editMode) {
      return baseColumns(handleSortClick);
    }
    return [
      ...baseColumns(handleSortClick),
      ...editColumns,
      {
        accessorKey: "action",
        header: () => <PlainTableHeader label="Action" />,
        cell: ({ row }) => (
          <ActionCell onClick={() => handleAction(row.original)} />
        ),
      },
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
            value={options.fromId}
            onChange={(e) => setOptions({ ...options, fromId: e, page: 1 })}
            placeholder="Select FROM member"
            options={members.map((each) => [each.id, each.name])}
          />

          <SelectInputGroup
            value={options.toId}
            onChange={(e) => setOptions({ ...options, toId: e, page: 1 })}
            placeholder="Select TO member"
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
            options={Object.entries(memberTransactionTypeMap)}
          />
          <PaginationFilters
            limit={Number(options.limit)}
            onLimitChange={(limit: any) =>
              setOptions({ ...options, limit, page: 1 })
            }
            onReset={handleOptionsReset}
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

export default MembersTransactionTable;
