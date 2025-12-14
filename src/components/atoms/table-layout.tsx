import { flexRender } from "@tanstack/react-table";
import React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/ui/utils";

type TableLayoutProps<_T> = {
  table: any;
  columns: any[];
  isLoading: boolean;
  isError?: boolean;
  noDataMessage?: string;
  className?: string;
};

function TableLayout<T>({
  table,
  columns,
  isLoading,
  isError = false,
  noDataMessage = "No results.",
  className,
}: TableLayoutProps<T>) {
  const itemLength = table.getRowModel().rows.length;
  const isValid = !isError && !isLoading && itemLength > 0;
  const isNoData = !isError && !isLoading && itemLength === 0;
  const isTrueError = isError && !isLoading;
  const isTrueLoading = !isError && isLoading;

  return (
    <Table className={cn(className, "table-auto w-full")}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup: any) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header: any) => (
              <TableHead key={header.id} data-table={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isTrueError && (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="text-center p-6 text-destructive"
            >
              Unexpected error on fetching the data
            </TableCell>
          </TableRow>
        )}

        {isTrueLoading && (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center p-6">
              Loading...
            </TableCell>
          </TableRow>
        )}

        {isValid &&
          table.getRowModel().rows.map((row: any) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell: any) => (
                <TableCell key={cell.id} className="px-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}

        {isNoData && (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center p-6">
              {noDataMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default TableLayout;
