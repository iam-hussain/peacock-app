"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { dateFormat, displayDateTime, fileDateTime } from "@/lib/date";
import TableLayout from "../../atoms/table-layout";
import { FilterBar } from "../../molecules/filter-bar-group";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import Typography from "../../ui/typography";
import { MemberResponse } from "@/app/api/members/route";

const baseColumns: ColumnDef<MemberResponse>[] = [
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
          row.original.clubFund
            ? row.original.clubFund.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              })
            : ""
        }
      />
    ),
  },
  {
    accessorKey: "deposit",
    header: ({ column }) => (
      <ActionTableHeader label="Deposit" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={row.original.deposit.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
        subLabel={
          row.original.offsetDeposit !== 0
            ? `${row.original.periodIn.toLocaleString("en-IN", { style: "currency", currency: "INR" })} + ${row.original.offsetDeposit.toLocaleString("en-IN", { style: "currency", currency: "INR" })}`
            : ""
        }
        className="min-w-[120px]"
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
        label={row.original.balance.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
        subLabel={
          row.original.offsetBalance !== 0
            ? `${row.original.periodBalance.toLocaleString("en-IN", { style: "currency", currency: "INR" })} + ${row.original.offsetBalance.toLocaleString("en-IN", { style: "currency", currency: "INR" })}`
            : ""
        }
        className="min-w-[120px]"
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
        label={row.original.returns.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })}
        className="min-w-[80px]"
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
        className="min-w-[80px]"
      />
    ),
  },
];

const editColumns: ColumnDef<MemberResponse>[] = [
  {
    accessorKey: "joinedAt",
    header: ({ column }) => (
      <ActionTableHeader label="Joined" column={column} />
    ),
    cell: ({ row }) => (
      <CommonTableCell
        label={dateFormat(new Date(row.original.joinedAt))}
        subLabel={row.original.id}
        className="min-w-[80px]"
      />
    ),
  },
];

export type MemberTableProps = {
  handleAction: (
    select: null | MemberResponse["member"],
    mode?: string,
  ) => void;
};

const MembersTable = ({ handleAction }: MemberTableProps) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [captureMode, setCaptureMode] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberResponse[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/members");
    const json = await res.json();
    setMembers(json.members);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        newTab.document.write(`<img src="${capturedImage}" alt="Captured Image" />`);
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

  const data = useMemo(() => {
    if (editMode) {
      return members;
    }
    return members.filter((e) => e.active);
  }, [editMode, members]);

  const columns = useMemo(() => {
    if (!editMode) {
      return baseColumns;
    }
    return [
      ...baseColumns,
      ...editColumns,
      {
        accessorKey: "member.id",
        header: () => <PlainTableHeader label="Action" />,
        cell: ({ row }) => (
          <ActionCell onClick={() => handleAction(row.original.member)} />
        ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  const table = useReactTable({
    data,
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
        onCapture={onCapture}
      />
      <div
        ref={captureRef}
        className={cn("flex bg-background", {
          "absolute p-8 pb-10 flex-col": captureMode,
        })}
      >
        <div
          className={cn(
            "hidden justify-end align-middle items-center flex-col pb-6 gap-2",
            {
              flex: captureMode,
            },
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
          loading={loading}
          className={cn({
            "w-auto p-8": captureMode,
          })}
        />
      </div>
    </div>
  );
};

export default MembersTable;
