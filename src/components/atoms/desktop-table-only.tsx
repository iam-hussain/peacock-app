"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface DesktopTableOnlyProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  frozenColumnKey?: string;
}

export function DesktopTableOnly<TData, TValue>({
  columns,
  data,
  frozenColumnKey,
}: DesktopTableOnlyProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  const frozenColumnIndex = frozenColumnKey
    ? columns.findIndex((col) => col.id === frozenColumnKey)
    : -1;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <div className="relative">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header, index) => {
                    const isFrozen = index === frozenColumnIndex;

                    return (
                      <TableHead
                        key={header.id}
                        className={`h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${
                          isFrozen ? "sticky left-0 z-20 bg-card border-r" : ""
                        } ${
                          header.column.columnDef.meta?.align === "right"
                            ? "text-right"
                            : header.column.columnDef.meta?.align === "center"
                              ? "text-center"
                              : "text-left"
                        }`}
                        style={
                          isFrozen
                            ? {
                                boxShadow: "2px 0 4px -2px rgba(0, 0, 0, 0.1)",
                              }
                            : undefined
                        }
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
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
                          className={`px-4 py-3 text-sm ${
                            isFrozen
                              ? "sticky left-0 z-10 bg-card border-r"
                              : ""
                          } ${
                            cell.column.columnDef.meta?.align === "right"
                              ? "text-right"
                              : cell.column.columnDef.meta?.align === "center"
                                ? "text-center"
                                : "text-left"
                          }`}
                          style={
                            isFrozen
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
  );
}
