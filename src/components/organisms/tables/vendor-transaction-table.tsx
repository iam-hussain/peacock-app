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
  ActionTableHeader,
  CommonTableCell,
  PaginationControls,
  ActionCell,
} from "../../atoms/table-component";
import TableLayout from "../../atoms/table-layout";
import { transactionMethodMap, vendorTransactionTypeMap } from "@/lib/config";
import { format } from "date-fns";
import { SelectInputGroup } from "../../atoms/select-input-group";
import { DatePickerGroup } from "../../atoms/date-picker-group";
import { PaginationFilters } from "../../molecules/pagination-filters";
import { TransformedVendorTransaction } from "@/app/api/vendor-transactions/route";
import { useQuery } from "@tanstack/react-query";
import { fetchVendorTransactions } from "@/lib/query-options";
import { TransformedVendorSelect } from "@/app/api/vendors/select/route";
import { TransformedMemberSelect } from "@/app/api/members/select/route";

const baseColumns = (
  handleSortClick: (id: string) => void,
): ColumnDef<TransformedVendorTransaction>[] => [
    {
      accessorKey: "vendor.name",
      header: () => <PlainTableHeader label="Vendor" />,
      cell: ({ row }) => (
        <AvatarCell
          id={row.original.vendor.id}
          avatar={row.original.vendor.memberAvatar}
          name={row.original.vendor.name}
          active={row.original.vendor.active}
          subLabel={row.original.vendor.memberName}
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
      accessorKey: "member.name",
      header: () => <PlainTableHeader label="Member" />,
      cell: ({ row }) => (
        <AvatarCell
          id={row.original.member.id}
          avatar={row.original.member.avatar}
          name={row.original.member.name}
          active={row.original.member.active}
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
          label={vendorTransactionTypeMap[row.original.transactionType]}
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
            "dd MMM yyyy hh:mm a",
          )}
        />
      ),
    },
  ];

const editColumns: ColumnDef<TransformedVendorTransaction>[] = [
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
  handleAction: (select: null | TransformedVendorTransaction) => void;
};

const VendorsTransactionTable = ({
  members,
  vendors,
  handleAction,
}: MembersTransactionTableProps) => {
  const [editMode, setEditMode] = useState(false);
  const [options, setOptions] = useState<any>(initialOptions);

  const { data, isLoading, isError } = useQuery(
    fetchVendorTransactions(options),
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
            options={Object.entries(vendorTransactionTypeMap)}
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

export default VendorsTransactionTable;
