/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { addDays, format } from 'date-fns';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Member, MEMBER_TRANSACTION_TYPE, MemberTransaction, TRANSACTION_METHOD } from '@prisma/client';
import { GET, MemberTransactionResponse } from '@/app/api/member-transactions/route';
import { cn } from '@/lib/utils';
import { FaCircle } from 'react-icons/fa';
import { AiOutlineDelete } from "react-icons/ai";
import { memberTransactionTypeMap, transactionMethodMap } from '@/lib/config';
import { MembersSelectResponse } from '@/actions/member-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DateRange } from "react-day-picker"
import { CalendarIcon } from "@radix-ui/react-icons"

const columns: ColumnDef<MemberTransactionResponse>[] = [
    {
        accessorKey: 'from.name',
        header: () => (
            <div className="text-xs uppercase hover:bg-transparent hover:font-extrabold px-2">
                From
            </div>
        ),
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
        accessorKey: 'to.name',
        header: () => (
            <div className="text-xs uppercase hover:bg-transparent hover:font-extrabold px-2">
                To
            </div>
        ),
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
        </div>,
    },
    {
        accessorKey: 'id',
        header: () => (
            <div className="text-xs uppercase hover:bg-transparent hover:font-extrabold px-2">
                ID
            </div>
        ),
        cell: ({ row }: any) => <div className="flex items-center justify-start gap-4 align-middle min-w-[175px]">
            <div>

                <p className='text-[0.7rem] text-foreground/70 m-0'>{row.original.id}</p>
                <p className='text-[0.7rem] text-foreground/70 m-0'>{format(new Date(row.original.createdAt), 'dd MMM yyyy hh:mm a')}</p>
            </div>
            <Button className='' variant={'ghost'}> <AiOutlineDelete className='w-4 h-4' /> </Button>
        </div>,
    },
]

const MemberTransactionTable = ({ members }: { members: MembersSelectResponse }) => {
    const [data, setData] = useState<MemberTransactionResponse[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        fromId: '',
        toId: '',
        transactionType: '',
    });
    const [sortField, setSortField] = useState('transactionAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [date, setDate] = React.useState<DateRange | undefined>(undefined)


    useEffect(() => {
        fetchData(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filters, sortField, sortOrder, date]);

    const fetchData = async (page: number) => {
        const params = new URLSearchParams({
            page: page.toString(),
            fromId: filters.fromId.trim(),
            toId: filters.toId.trim(),
            transactionType: filters.transactionType.trim(),
            sortField,
            sortOrder,
            ...(date?.from ? { startDate: date.from as any, } : {}),
            ...(date?.to ? { endDate: date.to as any, } : {}),
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
            <div className="flex justify-between gap-4 mb-4 flex-wrap md:flex-nowrap">
                {/* Filters */}
                <div className='flex justify-between gap-4 mb-4 flex-wrap md:flex-nowrap w-full'>
                    <Select
                        value={filters.fromId}
                        onValueChange={(e) => setFilters({ ...filters, fromId: e })} defaultValue='  '>
                        <SelectTrigger>
                            <SelectValue placeholder="Select FROM member" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={'  '}>
                                Select FROM member
                            </SelectItem>
                            {Object.entries(members).map(([key, value]) => (
                                <SelectItem key={key} value={value.id}>
                                    {value.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.toId}
                        onValueChange={(e) => setFilters({ ...filters, toId: e })} defaultValue='  '>
                        <SelectTrigger>
                            <SelectValue placeholder="Select TO member" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={'  '}>
                                Select TO member
                            </SelectItem>
                            {Object.entries(members).map(([key, value]) => (
                                <SelectItem key={key} value={value.id}>
                                    {value.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.transactionType}
                        onValueChange={(e) => setFilters({ ...filters, transactionType: e })} defaultValue='  '>
                        <SelectTrigger>
                            <SelectValue placeholder="Select TYPE" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={'  '}>
                                Select TYPE
                            </SelectItem>
                            {Object.entries(memberTransactionTypeMap).map(([key, value]) => (
                                <SelectItem key={key} value={key}>
                                    {value}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className={"grid gap-2 w-auto"}>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[300px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

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
