"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

import { cn } from "@/lib/ui/utils";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "right" | "center";
    tooltip?: string;
    columnClassName?: string;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  frozenColumnKey?: string;
  isLoading?: boolean;
  className?: string;
  pageSize?: number;
  sticky?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  frozenColumnKey,
  isLoading,
  className,
  pageSize = 50,
  sticky = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const stickyEnabled = sticky;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Find frozen column index
  const frozenColumnIndex = frozenColumnKey
    ? columns.findIndex((col) => col.id === frozenColumnKey)
    : -1;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-card">
                <TableRow className="border-b">
                  {columns.slice(0, Math.min(columns.length, 5)).map((_, i) => (
                    <TableHead key={i} className="h-12 px-4">
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-b">
                    {columns
                      .slice(0, Math.min(columns.length, 5))
                      .map((_, j) => (
                        <TableCell key={j} className="px-4 py-3">
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <div className="relative">
            <Table>
              <TableHeader
                className={cn("bg-card", stickyEnabled && "sticky top-0 z-10")}
              >
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b">
                    {headerGroup.headers.map((header, index) => {
                      const isFrozen = index === frozenColumnIndex;
                      const canSort = header.column.getCanSort();
                      const sortDirection = header.column.getIsSorted();

                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                            isFrozen &&
                              stickyEnabled &&
                              "sticky left-0 z-20 bg-card border-r",
                            header.column.columnDef.meta?.align === "right" &&
                              "text-right",
                            header.column.columnDef.meta?.align === "center" &&
                              "text-center",
                            header.column.columnDef.meta?.columnClassName
                          )}
                          style={
                            isFrozen && stickyEnabled
                              ? {
                                  boxShadow:
                                    "2px 0 4px -2px rgba(0, 0, 0, 0.1)",
                                }
                              : undefined
                          }
                        >
                          {header.isPlaceholder ? null : (
                            <TooltipProvider>
                              <div
                                className={cn(
                                  "flex items-center gap-2",
                                  header.column.columnDef.meta?.align ===
                                    "right"
                                    ? "justify-end"
                                    : header.column.columnDef.meta?.align ===
                                        "center"
                                      ? "justify-center"
                                      : "justify-start"
                                )}
                              >
                                {header.column.columnDef.meta?.tooltip ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2 cursor-help">
                                        <span>
                                          {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                          )}
                                        </span>
                                        {canSort && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              header.column.toggleSorting(
                                                header.column.getIsSorted() ===
                                                  "asc"
                                              );
                                            }}
                                          >
                                            {sortDirection === "asc" ? (
                                              <ArrowUp className="h-3 w-3" />
                                            ) : sortDirection === "desc" ? (
                                              <ArrowDown className="h-3 w-3" />
                                            ) : (
                                              <ArrowUpDown className="h-3 w-3" />
                                            )}
                                          </Button>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {header.column.columnDef.meta.tooltip}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <>
                                    <span>
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                    </span>
                                    {canSort && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        onClick={() =>
                                          header.column.toggleSorting(
                                            header.column.getIsSorted() ===
                                              "asc"
                                          )
                                        }
                                      >
                                        {sortDirection === "asc" ? (
                                          <ArrowUp className="h-3 w-3" />
                                        ) : sortDirection === "desc" ? (
                                          <ArrowDown className="h-3 w-3" />
                                        ) : (
                                          <ArrowUpDown className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </TooltipProvider>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map((cell, index) => {
                        const isFrozen = index === frozenColumnIndex;

                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "px-4 py-3 text-sm",
                              isFrozen &&
                                stickyEnabled &&
                                "sticky left-0 z-10 bg-card border-r",
                              cell.column.columnDef.meta?.align === "right" &&
                                "text-right",
                              cell.column.columnDef.meta?.align === "center" &&
                                "text-center",
                              cell.column.columnDef.meta?.columnClassName
                            )}
                            style={
                              isFrozen && stickyEnabled
                                ? {
                                    boxShadow:
                                      "2px 0 4px -2px rgba(0, 0, 0, 0.1)",
                                  }
                                : undefined
                            }
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
