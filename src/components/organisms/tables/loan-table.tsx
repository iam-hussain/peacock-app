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
import { LuView } from "react-icons/lu";

import {
  ActionTableHeader,
  AvatarCell,
  CommonTableCell,
  PlainTableHeader,
} from "../../atoms/table-component";
import TableLayout from "../../atoms/table-layout";

import { FilterBar } from "@/components/molecules/filter-bar-group";
import { Button } from "@/components/ui/button";
import Typography from "@/components/ui/typography";
import { dateFormat, displayDateTime, fileDateTime } from "@/lib/date";
import { fetchLoans } from "@/lib/query-options";
import { cn, moneyFormat } from "@/lib/utils";
import { TransformedLoan } from "@/transformers/account";

const baseColumns: ColumnDef<TransformedLoan>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ActionTableHeader label="Name" column={column} />,
    cell: ({ row }) => (
      <AvatarCell
        id={row.original.id}
        avatar={row.original.avatar}
        name={row.original.name}
        link={row.original.link}
        avatarName={row.original.name}
        active={row.original.active}
        // subLabel={"Loan"}
      />
    ),
  },
  {
    accessorKey: "startAt",
    header: ({ column }) => <ActionTableHeader label="From" column={column} />,
    cell: ({ row }) => (
      <CommonTableCell
        label={
          row.original.totalLoanBalance > 0 && row.original.startAt
            ? dateFormat(new Date(row.original.startAt))
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
  const captureRef = useRef<HTMLDivElement>(null);
  const [captureMode, setCaptureMode] = useState(false);

  const { data, isLoading, isError } = useQuery(fetchLoans());

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
          `<img src="${capturedImage}" alt="peacock_club_loan_${fileDateTime()}" />`
        );
      } else {
        const link = document.createElement("a");
        link.download = `peacock_club_loan_${fileDateTime()}.png`;
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
      <FilterBar
        searchValue={
          (table.getColumn("name")?.getFilterValue() as string) ?? ""
        }
        onSearchChange={(value) =>
          table.getColumn("name")?.setFilterValue(value)
        }
        onToggleChange={() => {}}
        toggleState={false}
        onAddClick={() => handleAction(null)}
        onCapture={onCapture}
        hasMode={false}
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
          <div className="flex justify-center align-middle flex-col items-center">
            <Typography variant={"h4"} className="text-2xl">
              Loans
            </Typography>
            <p className="test-sm text-foreground/80">{displayDateTime()}</p>
          </div>
        </div>
        <TableLayout
          table={table}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
};

export default LoanTable;
