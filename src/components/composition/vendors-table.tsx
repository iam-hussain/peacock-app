/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FaCircle } from "react-icons/fa";

const columns: ColumnDef<any>[] = [
    {
        accessorKey: 'vendor.name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Vendor
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-2 min-w-[170px] w-auto" data-id={row.original.id}>
                <div className='flex flex-col'>
                    <span className='text-foreground font-medium'>{row.original.vendor.name}</span>
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'amount',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Amount
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[150px]" data-id={row.original.id}>
                <p className=''>{row.original.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
            </div>
        ),
    },
    {
        accessorKey: 'transactionType',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Transaction Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[150px]" data-id={row.original.id}>
                <p className=''>{row.original.transactionType}</p>
            </div>
        ),
    },
    {
        accessorKey: 'method',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Method
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[150px]" data-id={row.original.id}>
                <p className=''>{row.original.method}</p>
            </div>
        ),
    },
    {
        accessorKey: 'transactionAt',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[150px]" data-id={row.original.id}>
                <p className=''>{new Date(row.original.transactionAt).toLocaleDateString()}</p>
            </div>
        ),
    },
    {
        accessorKey: 'member.name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Member
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center space-x-2 min-w-[170px] w-auto" data-id={row.original.id}>
                <div className='relative'>
                    <img src={row.original.member.avatar} alt="" className="w-10 h-10 rounded-lg border" />
                    <FaCircle className="h-3 w-3 absolute -top-1 -right-1 text-primary" />
                </div>
                <div className='flex flex-col'>
                    <span className='text-foreground font-medium'>{row.original.member.name}</span>
                </div>
            </div>
        ),
    },
]

const VendorTransactionsTable = () => {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        fetchData(1);
    }, []);

    const fetchData = async (page: number) => {
        const res = await fetch(`/api/vendor-transactions?page=${page}&limit=50`);
        const json = await res.json();
        setData(json.transaction);
    };

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

export default VendorTransactionsTable;
