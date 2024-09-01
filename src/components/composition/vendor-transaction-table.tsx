'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, ColumnDef } from '@tanstack/react-table';
import { Dialog } from '@/components/ui/dialog';
import { AvatarCell, PlainTableHeader, ActionTableHeader, CommonTableCell, PaginationControls, ActionCell } from '../table-helpers/table-component';
import TableLayout from '../table-helpers/table-layout';
import { transactionMethodMap, vendorTransactionTypeMap } from '@/lib/config';
import { format } from 'date-fns';
import { MembersSelectResponse } from '@/actions/member-select';
import { SelectInputGroup } from '../select-input-group';
import { DatePickerGroup } from '../date-picker-group';
import { PaginationFilters } from '../pagination-filters';
import { VendorsSelectResponse } from '@/actions/vendor-select';
import { VendorTransactionResponse } from '@/app/api/vendor-transactions/route';

const baseColumns = (handleSortClick: (id: string) => void): ColumnDef<VendorTransactionResponse>[] => [
    {
        accessorKey: 'vendor.name',
        header: () => <PlainTableHeader label="Vendor" />,
        cell: ({ row }) => (
            <AvatarCell
                id={row.original.vendor.id}
                avatar={row.original.vendor.memberAvatar}
                name={row.original.vendor.name}
                active={row.original.vendor.active}
                subLabel={row.original.vendor.memberName}
            />
        ),
    },
    {
        accessorKey: 'amount',
        header: ({ column }) => <ActionTableHeader onClick={handleSortClick} label="Amount" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={row.original.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                className="min-w-[100px]"
            />
        ),
    },
    {
        accessorKey: 'member.name',
        header: () => <PlainTableHeader label="Member" />,
        cell: ({ row }) => (
            <AvatarCell
                id={row.original.member.id}
                avatar={row.original.member.avatar}
                name={row.original.member.name}
                active={row.original.member.active}
            />
        ),
    },
    {
        accessorKey: 'transactionType',
        header: ({ column }) => <ActionTableHeader onClick={handleSortClick} label="Type" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={vendorTransactionTypeMap[row.original.transactionType]}
                subLabel={transactionMethodMap[row.original.method]}
                className="min-w-[130px]"
            />
        ),
    },
    {
        accessorKey: 'transactionAt',
        header: ({ column }) => <ActionTableHeader onClick={handleSortClick} label="Transaction At" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={format(new Date(row.original.transactionAt), 'dd MMM yyyy hh:mm a')}
                className="min-w-[150px]"
            />
        ),
    },

];

const editColumns: ColumnDef<VendorTransactionResponse>[] = [
    {
        accessorKey: 'updatedAt',
        header: () => <PlainTableHeader label="Updated / Created" />,
        cell: ({ row }) => (
            <CommonTableCell
                label={format(new Date(row.original.updatedAt), 'dd MMM yyyy hh:mm a')}
                subLabel={format(new Date(row.original.createdAt), 'dd MMM yyyy hh:mm a')}
                className="min-w-[150px]"
            />
        ),
    },
    {
        accessorKey: 'id',
        header: () => <PlainTableHeader label="ID" />,
        cell: ({ row }) => (
            <CommonTableCell
                label={row.original.id}
                className="min-w-[100px]"
            />
        ),
    },
];

const initialOptions = {
    vendorId: '',
    memberId: '',
    transactionType: '',
    startDate: undefined,
    endDate: undefined,
    limit: 10,
    page: 1,
    sortField: 'transactionAt',
    sortOrder: 'desc'
}


export type MembersTransactionTableProps = {
    members: MembersSelectResponse,
    vendors: VendorsSelectResponse
    handleAction: (select: null | VendorTransactionResponse) => void
}

const VendorsTransactionTable = ({ members, vendors, handleAction }: MembersTransactionTableProps) => {
    const [editMode, setEditMode] = useState(true);
    const [data, setData] = useState<VendorTransactionResponse[]>([]);

    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [options, setOptions] = useState<any>(initialOptions);


    const fetchData = async () => {
        setLoading(true)
        const params = new URLSearchParams({
            page: options.page.toString(),
            limit: options.limit.toString(),
            vendorId: options.vendorId.trim(),
            memberId: options.memberId.trim(),
            transactionType: options.transactionType.trim(),
            sortField: options.sortField,
            sortOrder: options.sortOrder,
            ...(options?.startDate ? { startDate: options.startDate as any, } : {}),
            ...(options?.endDate ? { endDate: options.endDate as any, } : {}),
        });

        const res = await fetch(`/api/vendor-transactions?${params.toString()}`);
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
                accessorKey: 'action',
                header: () => <PlainTableHeader label="Action" />,
                cell: ({ row }) => (
                    <ActionCell onClick={() => handleAction(row.original)} />
                ),
            }
        ]
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full">
                    <SelectInputGroup value={options.vendorId}
                        onChange={(e) => setOptions({ ...options, vendorId: e })}
                        placeholder="Select VENDOR"
                        options={vendors.map((each) => ([each.id, each.name]))} />

                    <SelectInputGroup value={options.memberId}
                        onChange={(e) => setOptions({ ...options, memberId: e })}
                        placeholder="Select MEMBER"
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
                        options={Object.entries(vendorTransactionTypeMap)}
                    />
                    <PaginationFilters
                        limit={Number(options.limit)}
                        onLimitChange={(limit: any) => setOptions({ ...options, limit })}
                        onReset={handleOptionsReset}
                        onToggleChange={setEditMode}
                        toggleState={editMode}
                    />
                </div>

                <TableLayout table={table} columns={columns} loading={loading} />
                <PaginationControls page={options.page} totalPages={totalPages} loading={loading} setPage={((page) => setOptions({ ...options, page }))} />
            </div>
        </Dialog>
    );
};

export default VendorsTransactionTable;
