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
import { MemberResponse } from '@/app/api/members/route';
import { cn } from '@/lib/utils';
import { Toggle } from '../ui/toggle';
import { FaCircle, FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";

const columns: ColumnDef<MemberResponse>[] = [
    // {
    //     accessorKey: 'id',
    //     header: 'ID',
    // },
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
            <div className="flex items-center space-x-2 min-w-[170px] w-auto" data-id={row.original.id}>
                <div className='relative'>
                    <img src={row.original.avatar} alt="" className="w-10 h-10 rounded-lg border" />
                    <FaCircle name={"FaCircle"} className={cn("h-3 w-3 absolute -top-1 -right-1", {
                        'text-primary': row.original.active,
                        'text-destructive': !row.original.active
                    })} />
                </div>
                <div className='flex flex-col'>
                    <span className='text-foreground font-medium'>{row.original.name}</span>
                    {row.original.clubFund != 0 && <p className='text-[0.8rem] text-foreground/70'>{row.original.clubFund.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>}
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'joined',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Joined
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[80px]" data-id={row.original.id}>
                <p className=''>{`${row.original.joined} months`}</p>
                <p className='text-[0.8rem] text-foreground/70 m-0'>{row.original.joinedAt}</p>
            </div>
        ),
    },
    {
        accessorKey: 'deposit',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Deposit
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[150px]" data-id={row.original.id}>
                <p className=''>{row.original.deposit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                {row.original.offsetDeposit != 0 && <p className='text-[0.8rem] text-foreground/70 m-0'>{`${row.original.periodIn.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} + ${row.original.offsetDeposit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`}</p>}
            </div>
        ),
    },
    {
        accessorKey: 'balance',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Balance
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[150px]" data-id={row.original.id}>
                <p className=''>{row.original.balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                {row.original.offsetBalance != 0 && <p className='text-[0.8rem] text-foreground/70 m-0'>{`${row.original.periodBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} + ${row.original.offsetBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`}</p>}

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
                Returns
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[80px]" data-id={row.original.id}>
                <p className=''>{row.original.returns.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
            </div>
        ),
    },
    {
        accessorKey: 'netValue',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2"
            >
                Net Value
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-start min-w-[80px]" data-id={row.original.id}>
                <p className=''>{row.original.netValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
            </div>
        ),
    },

]

const MembersTable = () => {
    const [showInactive, setShowInactive] = useState(false);
    const [data, setData] = useState<MemberResponse[]>([]);

    useEffect(() => {
        fetchData(1);
    }, []);

    const membersData = useMemo(() => {
        if (showInactive) {
            return data
        }
        return data.filter((e) => e.active)
    }, [showInactive, data])

    const fetchData = async (page: number) => {
        const res = await fetch(`/api/members?page=${page}&limit=50`);
        const json = await res.json();
        setData(json.members);
    };

    const table = useReactTable({
        data: membersData,
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
            <div className="flex justify-between mb-4">
                <Input
                    type="text"
                    placeholder="Filter names..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />

                <Toggle aria-label="Toggle italic" onPressedChange={setShowInactive} className='gap-2'>
                    {showInactive ? <FaEye /> : <FaEyeSlash />}
                    Inactive
                </Toggle>
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
                            <TableRow key={row.id} >
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

export default MembersTable;
