'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, ColumnDef } from '@tanstack/react-table';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AvatarCell, PlainTableHeader, CommonTableCell, PaginationControls, ActionTableHeader } from '../table-helpers/table-component';
import TableLayout from '../table-helpers/table-layout';
import { MemberForm } from '../forms/member';
import { MemberTransactionResponse } from '@/app/api/member-transactions/route';
import { memberTransactionTypeMap, transactionMethodMap } from '@/lib/config';
import { format } from 'date-fns';
import { AiOutlineDelete } from 'react-icons/ai';
import { MembersSelectResponse } from '@/actions/member-select';
import { SelectInputGroup } from '../select-input-group';
import { DatePickerGroup } from '../date-picker-group';
import { PaginationFilters } from '../pagination-filters';

const baseColumns = (handleSortClick: (id: string) => void): ColumnDef<MemberTransactionResponse>[] => ([
    {
        accessorKey: 'from.name',
        header: () => <PlainTableHeader label="From" />,
        cell: ({ row }) => (
            <AvatarCell
                id={row.original.from.id}
                avatar={row.original.from.avatar}
                name={row.original.from.name}
                active={row.original.from.active}
            />
        ),
    },
    {
        accessorKey: 'amount',
        header: ({ column }) => <ActionTableHeader column={column} onClick={handleSortClick} label="Amount" />,
        cell: ({ row }) => (
            <CommonTableCell
                label={row.original.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                className="min-w-[80px]"
            />
        ),
    },
    {
        accessorKey: 'to.name',
        header: () => <PlainTableHeader label="To" />,
        cell: ({ row }) => (
            <AvatarCell
                id={row.original.to.id}
                avatar={row.original.to.avatar}
                name={row.original.to.name}
                active={row.original.to.active}
            />
        ),
    },
    {
        accessorKey: 'transactionType',
        header: ({ column }) => <ActionTableHeader column={column} onClick={handleSortClick} label="Type" />,
        cell: ({ row }) => (
            <CommonTableCell
                label={memberTransactionTypeMap[row.original.transactionType]}
                subLabel={transactionMethodMap[row.original.method]}
                className="min-w-[130px]"
            />
        ),
    },
    {
        accessorKey: 'transactionAt',
        header: ({ column }) => <ActionTableHeader column={column} onClick={handleSortClick} label="Transaction At" />,
        cell: ({ row }) => (
            <CommonTableCell
                label={format(new Date(row.original.transactionAt), 'dd MMM yyyy hh:mm a')}
                className="min-w-[140px]"
            />
        ),
    },
    {
        accessorKey: 'id',
        header: () => <PlainTableHeader label="ID" />,
        cell: ({ row }) => (
            <CommonTableCell
                label={row.original.id}
                subLabel={format(new Date(row.original.createdAt), 'dd MMM yyyy hh:mm a')}
                className="min-w-[100px]"
            />
        ),
    },
]);

const editColumns: ColumnDef<MemberTransactionResponse>[] = [
];

const initialOptions = {
    fromId: '',
    toId: '',
    transactionType: '',
    startDate: undefined,
    endDate: undefined,
    limit: 10,
    page: 1,
    sortField: 'transactionAt',
    sortOrder: 'desc'
}


const MembersTransactionTable = ({ members }: { members: MembersSelectResponse }) => {
    const [editMode, setEditMode] = useState(true);
    const [data, setData] = useState<MemberTransactionResponse[]>([]);
    const [selected, setSelected] = useState<null | MemberTransactionResponse>(null);

    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [options, setOptions] = useState<any>(initialOptions);


    const fetchData = async () => {
        setLoading(true)
        const params = new URLSearchParams({
            page: options.page.toString(),
            limit: options.limit.toString(),
            fromId: options.fromId.trim(),
            toId: options.toId.trim(),
            transactionType: options.transactionType.trim(),
            sortField: options.sortField,
            sortOrder: options.sortOrder,
            ...(options?.startDate ? { startDate: options.startDate as any, } : {}),
            ...(options?.endDate ? { endDate: options.startDate as any, } : {}),
        });

        const res = await fetch(`/api/member-transactions?${params.toString()}`);
        const json = await res.json();
        setData(json.transactions);
        setTotalPages(json.totalPages);
        setLoading(false)
    };

    const handleOptionsReset = () => {
        setOptions(initialOptions)
    }

    const handleSortClick = (id: string) => {
        setOptions((item: any) => ({
            ...item,
            sortField: id,
            sortOrder: item.sortOrder === 'asc' ? 'desc' : 'asc'
        }))
    }

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options]);


    const columns = useMemo(() => {
        if (!editMode) {
            return baseColumns(handleSortClick)
        }
        return [
            ...baseColumns(handleSortClick),
            ...editColumns,
            {
                accessorKey: 'id',
                header: () => <PlainTableHeader label="Action" />,
                cell: ({ row }) => (
                    <Button variant="ghost">
                        <AiOutlineDelete onClick={() => setSelected(row.original)} />
                    </Button>
                ),
            }
        ]
    }, [editMode]);

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
            pagination: { pageIndex: options.page - 1, pageSize: 10 },
            sorting: [{ id: options.sortField, desc: options.sortOrder === 'desc' }],
        },
    });

    return (
        <Dialog>
            <div className='w-full'>
                <div className="grid gap-2 pb-6 sm:grid-cols-3 md:grid-cols-6 grid-cols-2">
                    <SelectInputGroup value={options.fromId}
                        onChange={(e) => setOptions({ ...options, fromId: e })}
                        placeholder="Select FROM member"
                        options={members.map((each) => ([each.id, each.name]))} />

                    <SelectInputGroup value={options.toId}
                        onChange={(e) => setOptions({ ...options, toId: e })}
                        placeholder="Select TO member"
                        options={members.map((each) => ([each.id, each.name]))} />

                    <DatePickerGroup
                        selectedDate={options.startDate}
                        onSelectDate={(e) => setOptions({ ...options, startDate: e })}
                        placeholder={'Date FROM'} />

                    <DatePickerGroup
                        selectedDate={options.endDate}
                        onSelectDate={(e) => setOptions({ ...options, endDate: e })}
                        placeholder={'Date TO'} />

                    <SelectInputGroup
                        value={options.transactionType}
                        onChange={(e) => setOptions({ ...options, transactionType: e })}
                        placeholder="Select TYPE"
                        options={Object.entries(memberTransactionTypeMap)}
                    />
                    <PaginationFilters
                        limit={Number(options.limit)}
                        onLimitChange={(limit: any) => setOptions({ ...options, limit })}
                        onReset={handleOptionsReset}
                    />
                </div>

                <TableLayout table={table} columns={columns} loading={loading} />
                <PaginationControls page={options.page} totalPages={totalPages} loading={loading} setPage={((page) => setOptions({ ...options, page }))} />
                <DialogContent className="">
                    <DialogHeader>
                        <DialogTitle>{selected ? 'Update' : 'Add'} Member</DialogTitle>
                        {selected && <DialogDescription>Member ID: {selected.id}</DialogDescription>}
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <MemberForm member={selected} />
                    </div>
                </DialogContent>
            </div>
        </Dialog>
    );
};

export default MembersTransactionTable;
