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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AiOutlineDelete } from 'react-icons/ai';

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
            <div className="flex items-center space-x-2 min-w-[170px]" data-id={row.original.vendor.id}>
                <div className='relative'>
                    <img src={row.original.vendor.memberAvatar} alt="" className="w-10 h-10 rounded-lg border" />
                    <FaCircle name={"FaCircle"} className={cn("h-3 w-3 absolute -top-1 -right-1", {
                        'text-primary': row.original.vendor.active,
                        'text-destructive': !row.original.vendor.active
                    })} />
                </div>
                <div className='flex flex-col'>
                    <p className=''>{row.original.vendor.name}</p>
                    {row.original.vendor.memberName && <span className='text-[0.7rem] text-foreground/70'>{row.original.vendor.memberName}</span>}
                </div>
            </div >
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
            <div className="flex flex-col items-start min-w-[100px]" data-id={row.original.id}>
                <p className=''>{row.original.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
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
    {
        accessorKey: 'transactionType',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[120px]" data-id={row.original.id}>
                <p className=''>{row.original.transactionType}</p>
                <p className='text-[0.7rem] text-foreground/70'>{row.original.method}</p>
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
                Transaction At
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }: any) => <div className="flex flex-col items-start min-w-[150px]">
            <p className='text-foreground font-medium'>{format(new Date(row.original.transactionAt), 'dd MMM yyyy hh:mm a')}</p>
        </div>,
    },
    {
        accessorKey: 'id',
        header: () => (
            <div className="text-xs uppercase hover:bg-transparent hover:font-extrabold px-2">
                ID
            </div>
        ),
        cell: ({ row }: any) => <div className="flex flex-col items-start min-w-[100px]">
            <p className='text-[0.7rem] text-foreground/70 m-0'>{row.original.id}</p>
            <p className='text-[0.7rem] text-foreground/70 m-0'>{format(new Date(row.original.createdAt), 'dd MMM yyyy hh:mm a')}</p>
        </div>,
    },
    {
        accessorKey: 'action',
        header: () => (
            <div className="text-xs uppercase hover:bg-transparent hover:font-extrabold text-center">
                Action
            </div>
        ),
        cell: ({ row }: any) => <div className="flex items-center justify-center gap-4 align-middle min-w-[40px]">
            <Button className='' variant={'ghost'}> <AiOutlineDelete className='w-4 h-4' /> </Button>
        </div>,
    },
]

const VendorTransactionTable = () => {
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        vendorId: '',
        memberId: '',
        transactionType: '',
        startDate: '',
        endDate: '',
    });
    const [sortField, setSortField] = useState('transactionAt');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        fetchData(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filters, sortField, sortOrder]);

    const fetchData = async (page: number) => {
        const params = new URLSearchParams({
            page: page.toString(),
            vendorId: filters.vendorId,
            memberId: filters.memberId,
            transactionType: filters.transactionType,
            startDate: filters.startDate,
            endDate: filters.endDate,
            sortField,
            sortOrder,
        });

        const res = await fetch(`/api/vendor-transactions?${params.toString()}`);
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
        manualSorting: true,
        pageCount: totalPages,
        state: {
            pagination: { pageIndex: page - 1, pageSize: 10 },
            sorting: [{ id: sortField, desc: sortOrder === 'desc' }],
        },
    });

    return (
        <div className='w-full'>
            <div className="flex justify-between mb-4">
                {/* Filters */}
                <Input
                    type="text"
                    placeholder="Filter by member ID..."
                    value={filters.vendorId}
                    onChange={(e) => setFilters({ ...filters, vendorId: e.target.value })}
                />
                <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
                <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
            </div>

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header, i) => (
                                <TableHead key={header.id}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className='px-4'>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="mt-4 flex justify-between align-middle items-center gap-4">
                <Button onClick={() => setPage(page - 1)} disabled={page === 1} variant={'outline'} className='min-w-[100px]'>Previous</Button>
                <span className='text-sm text-foreground/90'>Page {page} of {totalPages}</span>
                <Button onClick={() => setPage(page + 1)} disabled={page === totalPages} variant={'outline'} className='min-w-[100px]'>Next</Button>
            </div>
        </div>
    );
};

export default VendorTransactionTable;
