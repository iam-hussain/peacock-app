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
import html2canvas from "html2canvas";
import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  ActionCell,
  ActionTableHeader,
  AvatarCell,
  CommonTableCell,
  PlainTableHeader,
} from "../../atoms/table-component";
import TableLayout from "../../atoms/table-layout";
import { FilterBar } from "../../molecules/filter-bar-group";
import Typography from "../../ui/typography";

import { TransformedMember } from "@/app/api/member/route";
import { dateFormat, displayDateTime, fileDateTime } from "@/lib/date";
import { fetchMembers } from "@/lib/query-options";
import { cn } from "@/lib/utils";

const baseColumns: ColumnDef<TransformedMember>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ActionTableHeader label="Name" column={column} />,
    cell: ({ row }) => (
      <AvatarCell
        id={row.original.id}
        avatar={row.original.avatar}
        name={row.original.name}
        active={row.original.active}
        subLabel={
          row.original.clubHeldAmount
            ? row.original.clubHeldAmount.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })
            : ""
        }
      />
    ),
  },
  {
    accessorKey: "totalDepositAmount",
    header: ({ column }) => (
      <ActionTableHeader label="Deposit" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.totalDepositAmount.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
        // subLabel={
        //   row.original.offsetDepositAmount !== 0
        //     ? `${row.original.periodicDepositAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })} + ${row.original.offsetDepositAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}`
        //     : ""
        // }
      />
    ),
  },
  {
    accessorKey: "totalOffsetAmount",
    header: ({ column }) => (
      <ActionTableHeader label="Offset" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.totalOffsetAmount.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
        subLabel={
          row.original.totalOffsetAmount !== 0
            ? `${row.original.totalVendorOffsetAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })} + ${row.original.totalLoanOffsetAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}`
            : ""
        }
      />
    ),
  },
  {
    accessorKey: "totalBalanceAmount",
    header: ({ column }) => (
      <ActionTableHeader label="Balance" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.totalBalanceAmount.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
        greenLabel={row.original.totalBalanceAmount <= 0}
        redLabel={row.original.totalBalanceAmount > 0}
        // subLabel={
        //   row.original.totalPeriodBalanceAmount !== 0
        //     ? `${row.original.totalPeriodBalanceAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })} + ${row.original.totalPeriodBalanceAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}`
        //     : ""
        // }
      />
    ),
  },
  {
    accessorKey: "returns",
    header: ({ column }) => (
      <ActionTableHeader label="Returns" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.totalReturnAmount.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
      />
    ),
  },
  {
    accessorKey: "netValue",
    header: ({ column }) => (
      <ActionTableHeader label="Net Value" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.netValue.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
      />
    ),
  },
];

const editColumns: ColumnDef<TransformedMember>[] = [
  {
    accessorKey: "startAt",
    header: ({ column }) => (
      <ActionTableHeader label="Joined" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={dateFormat(new Date(row.original.startAt))}
        subLabel={row.original.id}
      />
    ),
  },
];

export type MemberTableProps = {
  handleAction: (select: null | TransformedMember["member"]) => void;
};

const MembersTable = ({ handleAction }: MemberTableProps) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [captureMode, setCaptureMode] = useState(false);

  const [editMode, setEditMode] = useState(false);

  const { data, isLoading, isError } = useQuery(fetchMembers());

  const onCapture = async () => {
    if (captureRef.current) {
      setCaptureMode(true);
    }
  };

  const handleOnCapture = async () => {
    if (captureRef.current) {
      const canvas = await html2canvas(captureRef.current, {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      });
      setCaptureMode(false);
      const capturedImage = canvas.toDataURL("image/png");
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(
          `<img src="${capturedImage}" alt="peacock_club_${fileDateTime()}" />`
        );
      } else {
        const link = document.createElement("a");
        link.download = `peacock_club_${fileDateTime()}.png`;
        link.href = capturedImage;
        link.click();
      }
    }
  };

  useEffect(() => {
    if (captureMode) {
      handleOnCapture();
    }
  }, [captureMode]);

  const tableData = useMemo(() => {
    if (!data || !data.members) {
      return [];
    }
    if (editMode) {
      return data.members;
    }
    return data.members.filter((e) => e.active);
  }, [editMode, data]);

  const actionColumn = {
    accessorKey: "action",
    header: () => <PlainTableHeader label="Action" />,
    cell: ({ row }: any) => (
      <ActionCell onClick={() => handleAction(row.original.member)} />
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
    data: tableData,
    columns: columns,
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
    <div className="w-full ">
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
        onCapture={onCapture}
      />
      <div
        ref={captureRef}
        className={cn("flex bg-background", {
          "absolute p-8 pb-16 flex-col": captureMode,
        })}
      >
        <div
          className={cn(
            "hidden justify-end align-middle items-center flex-col pb-6 gap-2",
            {
              flex: captureMode,
            }
          )}
        >
          <Typography variant={"brandMini"} className="text-4xl">
            Peacock Club
          </Typography>
          <p className="test-sm text-foreground/80">{displayDateTime()}</p>
        </div>
        <TableLayout
          table={table}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          className={cn({
            "w-auto p-8 border": captureMode,
          })}
        />
      </div>
    </div>
  );
};

export default MembersTable;
