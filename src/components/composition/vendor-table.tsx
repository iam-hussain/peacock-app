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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FaEdit } from "react-icons/fa";
import { GetVendorResponse, GetVendorsResponse } from '@/actions/vendors';
import { VendorForm } from '../forms/vendor';
import { MembersSelectResponse } from '@/actions/member-select';
import { dateFormat } from '@/lib/date';
import { FaCircle } from 'react-icons/fa6';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import Box from '../ui/box';
import { TiUserAdd } from 'react-icons/ti';
import { vendorTypeMap } from '@/lib/config';

// Column Definitions for Vendor Table
const columnsBase: ColumnDef<GetVendorResponse>[] = [
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
                <div className='relative'>
                    <img src={row.original.memberAvatar} alt="" className="w-10 h-10 rounded-lg border" />
                    <FaCircle name={"FaCircle"} className={cn("h-3 w-3 absolute -top-1 -right-1", {
                        'text-primary': row.original.active,
                        'text-destructive': !row.original.active
                    })} />
                </div>
                <div className='flex flex-col'>
                    <p className=''>{row.original.name}</p>
                    {row.original.memberName && <span className='text-[0.7rem] text-foreground/70'>{row.original.memberName}</span>}
                </div>
            </div >

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
                <p className=''>{dateFormat(new Date(row.original.startAt))}</p>
                {row.original.endAt && <p className='text-[0.8rem] text-foreground/70'>{dateFormat(new Date(row.original.endAt))}</p>}
                <p className='text-[0.7rem] text-foreground/70'>{row.original.id}</p>
            </div>
        ),
    },
    {
        accessorKey: 'type',
        header: ({ column }) => (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="uppercase hover:bg-transparent hover:font-extrabold px-2 w-full"
            >
                Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex flex-col items-center min-w-[50px]" data-id={row.original.id}>
                <p className=''>{vendorTypeMap[row.original.type]}</p>
                {['LEND', "CHIT"].includes(row.original.type) && <p className='text-[0.7rem] text-foreground/70'>{row.original.terms} terms</p>}
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
                {row.original.calcReturns && <p className={'text-emerald-500'}>{row.original.returns.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>}
                {!row.original.calcReturns && <p>{row.original.type === 'LEND' ? row.original.returns.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : ' - '}</p>}
            </div>
        ),
    },
]

const VendorTable = ({ vendors, members }: { vendors: GetVendorsResponse; members: MembersSelectResponse }) => {
    const [formSelected, setFormSelected] = useState<null | GetVendorResponse['vendor']>(null);


    const action: ColumnDef<GetVendorResponse> = {
        accessorKey: 'vendor.id',
        header: ({ column }) => (
            <div className="text-xs uppercase hover:bg-transparent hover:font-extrabold px-2">
                Action
            </div>
        ),
        cell: ({ row }) => (
            <DialogTrigger asChild>
                <Button variant={'ghost'} className='px-3 py-1' onClick={() => setFormSelected(row.original.vendor)}><FaEdit className='h-4 w-4' /></Button>
            </DialogTrigger>
        ),
    }


    const columns = useMemo(() => {

        return [...columnsBase, action]
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])



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
        <Dialog>
            <div className='w-full'>
                <div className="flex justify-between mb-4 gap-3">
                    <Input
                        type="text"
                        placeholder="Filter names..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                    <Box className='w-auto gap-4'>
                        <DialogTrigger asChild>
                            <Button variant="outline" onClick={() => setFormSelected(null)}><TiUserAdd className='w-6 h-6' /></Button>
                        </DialogTrigger>
                    </Box>
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
                                        <TableCell key={cell.id} className='px-4'>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center p-6">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <DialogContent className="">
                    <DialogHeader>
                        <DialogTitle>{formSelected ? 'Update' : 'Add'} Vendor</DialogTitle>
                        {formSelected && <DialogDescription>Vendor ID: {formSelected.id}</DialogDescription>}
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <VendorForm vendor={formSelected} members={members} />
                    </div>
                </DialogContent>
            </div>
        </Dialog>
    );
};

export default VendorTable;
