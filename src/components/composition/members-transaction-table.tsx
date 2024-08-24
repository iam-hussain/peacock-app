'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Member, MemberTransaction } from '@prisma/client';

type Transaction = MemberTransaction & {
    to: Member,
    from: Member

}

const MemberTransactionTable = () => {
    const [data, setData] = useState<Transaction[]>([]);
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

    const columns = useMemo(() => [
        {
            header: 'From',
            accessorKey: 'from.firstName',
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <img src={row.original.from.avatar || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full" />
                    <span>{row.original.from.firstName}</span>
                </div>
            ),
        },
        {
            header: 'Amount',
            accessorKey: 'amount',
            cell: ({ row }: any) => <span className="text-green-600">{row.original.amount} ₹</span>,
        },
        {
            header: 'To',
            accessorKey: 'to.firstName',
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <img src={row.original.to.avatar || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full" />
                    <span>{row.original.to.firstName}</span>
                </div>
            ),
        },
        {
            header: 'Transaction Type',
            accessorKey: 'transactionType',
        },
        {
            header: 'Transaction At',
            accessorKey: 'transactionAt',
            cell: ({ row }: any) => format(new Date(row.original.transactionAt), 'dd MMM yyyy'),
        },
        {
            header: 'Method',
            accessorKey: 'method',
        },
    ], []);

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
        <div>
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
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSortField(header.column.id);
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        }}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
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

export default MemberTransactionTable;
