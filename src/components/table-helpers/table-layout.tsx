import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { flexRender } from '@tanstack/react-table';

type TableLayoutProps<T> = {
    table: any;
    columns: any[];
    loading: boolean;
    noDataMessage?: string;
};

function TableLayout<T>({ table, columns, loading, noDataMessage = "No results." }: TableLayoutProps<T>) {
    return (
        <Table className=''>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup: any) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header: any) => (
                            <TableHead key={header.id}>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="text-center p-6">
                            Loading...
                        </TableCell>
                    </TableRow>
                ) : (
                    table.getRowModel().rows.map((row: any) => (
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell: any) => (
                                <TableCell key={cell.id} className="px-4">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                )}
                {table.getRowModel().rows.length === 0 && !loading && (
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

export default TableLayout
