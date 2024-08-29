/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaCircle } from "react-icons/fa";
import { GetVendorResponse, GetVendorsResponse } from '@/actions/vendors';

// Column Definitions for Vendor Table
const columns: ColumnDef<GetVendorResponse>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-2 min-w-[170px]" data-id={row.original.id}>
                <img src={row.original.memberAvatar} alt="" className="w-10 h-10 rounded-lg border" />
                <div className='flex flex-col'>
                    <p className=''>{row.original.name}</p>
                    {row.original.memberName && <span className='text-[0.7rem] text-foreground/70'>{row.original.memberName}</span>}
                </div>
            </div>

        ),
    },
    {
        accessorKey: 'startAt',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Started At
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[80px]" data-id={row.original.id}>
                <p className=''>{row.original.startAt}</p>
                {row.original.endAt && <p className='text-[0.8rem] text-foreground/70'>{row.original.endAt}</p>}
                <p className='text-[0.7rem] text-foreground/70'>{row.original.id}</p>
            </div>
        ),
    },
    {
        accessorKey: 'terms',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2 w-full"
            >
                Terms
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-center min-w-[50px]" data-id={row.original.id}>
                <p className=''>{row.original.terms}</p>
            </div>
        ),
    },
    {
        accessorKey: 'invest',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Invest
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[80px]" data-id={row.original.id}>
                <p className=''>{row.original.invest.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
            </div>
        ),
    },
    {
        accessorKey: 'profit',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Profit
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[80px]" data-id={row.original.id}>
                <p className=''>{row.original.profit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
            </div>
        ),
    },

    {
        accessorKey: 'returns',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Return
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[80px]" data-id={row.original.id}>
                <p className='text-emerald-500'>{row.original.returns.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
            </div>
        ),
    },
]

const VendorTable = ({ vendors }: { vendors: GetVendorsResponse }) => {

    const table = useReactTable({
        data: vendors,
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
        <div className='w-full'>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className='px-4'>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default VendorTable;
