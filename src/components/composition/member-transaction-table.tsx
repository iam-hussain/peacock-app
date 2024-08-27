/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Member, MEMBER_TRANSACTION_TYPE, MemberTransaction, TRANSACTION_METHOD } from '@prisma/client';
import { GET, MemberTransactionResponse } from '@/app/api/member-transactions/route';
import { cn } from '@/lib/utils';
import { FaCircle } from 'react-icons/fa';
import { AiOutlineDelete } from "react-icons/ai";
import { memberTransactionTypeMap, transactionMethodMap } from '@/lib/config';



const columns: ColumnDef<MemberTransactionResponse>[] = [
    {
        header: 'From',
        accessorKey: 'from.name',
        cell: ({ row }: any) => (
            <div className="flex items-center space-x-2 min-w-[170px] w-auto" data-id={row.original.from.id}>
                <div className='relative'>
                    <img src={row.original.from.avatar} alt="" className="w-10 h-10 rounded-lg border" />
                    <FaCircle name={"FaCircle"} className={cn("h-3 w-3 absolute -top-1 -right-1", {
                        'text-primary': row.original.from.active,
                        'text-destructive': !row.original.from.active
                    })} />
                </div>
                <div className='flex flex-col'>
                    <span className='text-foreground font-medium'>{row.original.from.name}</span>
                </div>
            </div>
        ),
    },
    {
        header: 'Amount',
        accessorKey: 'amount',
        cell: ({ row }: any) => <div className="flex flex-col items-start min-w-[80px]" data-id={row.original.id}>
            <p className=''>{row.original.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
        </div>,
    },
    {
        header: 'To',
        accessorKey: 'to.name',
        cell: ({ row }: any) => (
            <div className="flex items-center space-x-2 min-w-[170px] w-auto" data-id={row.original.to.id}>
                <div className='relative'>
                    <img src={row.original.to.avatar} alt="" className="w-10 h-10 rounded-lg border" />
                    <FaCircle name={"FaCircle"} className={cn("h-3 w-3 absolute -top-1 -right-1", {
                        'text-primary': row.original.to.active,
                        'text-destructive': !row.original.to.active
                    })} />
                </div>
                <div className='flex flex-col'>
                    <span className='text-foreground font-medium'>{row.original.to.name}</span>
                </div>
            </div>
        ),
    },
    {
        header: 'Type',
        accessorKey: 'transactionType',
        cell: ({ row }: any) => <div className="flex flex-col items-start min-w-[50px]">
            <p className='text-foreground font-medium'>{memberTransactionTypeMap[row.original.transactionType as MEMBER_TRANSACTION_TYPE]}</p>
            <p className='text-[0.7rem] text-foreground/70 m-0'>{transactionMethodMap[row.original.method as TRANSACTION_METHOD]}</p>
        </div>,
    },

    {
        header: 'Transaction At',
        accessorKey: 'transactionAt',
        cell: ({ row }: any) => <div className="flex flex-col items-start min-w-[140px]">
            <p className='text-foreground font-medium'>{format(new Date(row.original.transactionAt), 'dd MMM yyyy hh:mm a')}</p>
            <p className='text-[0.7rem] text-foreground/70 m-0'>{format(new Date(row.original.createdAt), 'dd MMM yyyy hh:mm a')}</p>
        </div>,
    },
    {
        header: 'ID',
        accessorKey: 'id',
        cell: ({ row }: any) => <div className="flex items-center justify-start gap-2 align-middle min-w-[175px]">
            <p className='text-[0.7rem] text-foreground/70 m-0'>{row.original.id}</p>
            <Button className='p-1' variant={'ghost'}> <AiOutlineDelete /> </Button>
        </div>,
    },
]

const MemberTransactionTable = () => {
    const [data, setData] = useState<MemberTransactionResponse[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        fromId: '',
        toId: '',
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
            fromId: filters.fromId,
            toId: filters.toId,
            transactionType: filters.transactionType,
            startDate: filters.startDate,
            endDate: filters.endDate,
            sortField,
            sortOrder,
        });

        const res = await fetch(`/api/member-transactions?${params.toString()}`);
        const json = await res.json();
        setData(json.transactions);
        setTotalPages(json.totalPages);
    };



    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
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
                    value={filters.fromId}
                    onChange={(e) => setFilters({ ...filters, fromId: e.target.value })}
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
                                    {![1, 4].includes(i) ? <p className='m-0 p-0 uppercase px-2 text-[0.8rem]'>{flexRender(header.column.columnDef.header, header.getContext())}</p> :
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="uppercase px-2 hover:bg-transparent hover:font-extrabold"
                                            onClick={() => {
                                                setSortField(header.column.id);
                                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            }}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>}

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

export default MemberTransactionTable;
