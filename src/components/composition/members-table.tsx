'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
} from '@tanstack/react-table';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { membersTableTransform } from '@/app/api/members/route';

type Member = ReturnType<typeof membersTableTransform>

const MembersTable = () => {
    const [data, setData] = useState<Member[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchData(page);
    }, [page, filter]);

    const fetchData = async (page: number) => {
        const res = await fetch(`/api/members?page=${page}&limit=50&filter=${filter}`);
        const json = await res.json();
        setData(json.members);
        setTotalPages(json.totalPages);
    };

    const columns: ColumnDef<Member>[] = [
        {
            accessorKey: 'id',
            header: 'ID',
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="uppercase"
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center space-x-2">
                    <img src={row.original.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <span>{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
        },
        {
            accessorKey: 'clubFund',
            header: 'Club Fund',
            cell: ({ row }) => <span>{row.original.clubFund.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>,
        },
        {
            accessorKey: 'joined',
            header: 'Joined',
        },
        {
            accessorKey: 'deposit',
            header: 'Deposit',
            cell: ({ row }) => <span>{row.original.deposit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>,
        },
        {
            accessorKey: 'offsetDeposit',
            header: 'Offset Deposit',
            cell: ({ row }) => <span>{row.original.offsetDeposit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>,
        },
        {
            accessorKey: 'offsetBalance',
            header: 'Offset Balance',
            cell: ({ row }) => <span>{row.original.offsetBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>,
        },
        {
            accessorKey: 'returns',
            header: 'Returns',
            cell: ({ row }) => <span>{row.original.returns.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>,
        },
        {
            accessorKey: 'netValue',
            header: 'Net Value',
            cell: ({ row }) => <span>{row.original.netValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>,
        },
    ]

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        pageCount: totalPages,
        state: {
            pagination: { pageIndex: page - 1, pageSize: 50 },
        },
    });

    return (
        <div>
            <div className="flex justify-between mb-4">
                <Input
                    type="text"
                    placeholder="Filter names..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-sm"
                />
            </div>

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
                                    <TableCell key={cell.id}>
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

            <div className="mt-4 flex justify-between">
                <Button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</Button>
                <span>Page {page} of {totalPages}</span>
                <Button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</Button>
            </div>
        </div>
    );
};

export default MembersTable;
