'use client';

import React, { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, ColumnDef, getFilteredRowModel } from '@tanstack/react-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { GetMembersResponse, GetMemberResponse } from '@/actions/members';
import { AvatarCell, PlainTableHeader, ActionTableHeader, CommonTableCell, ActionCell } from '../table-helpers/table-component';
import { dateFormat } from '@/lib/date';
import TableLayout from '../table-helpers/table-layout';
import { MemberForm } from '../forms/member';
import { FilterBar } from '../filter-bar-group';
import { Button } from '../ui/button';

const baseColumns: ColumnDef<GetMemberResponse>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => <ActionTableHeader label="Name" column={column} />,
        cell: ({ row }) => (
            <AvatarCell
                id={row.original.id}
                avatar={row.original.avatar}
                name={row.original.name}
                active={row.original.active}
                subLabel={row.original.clubFund ? row.original.clubFund.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : ''}
            />
        ),
    },
    {
        accessorKey: 'deposit',
        header: ({ column }) => <ActionTableHeader label="Deposit" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={row.original.deposit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                subLabel={row.original.offsetDeposit !== 0 ? `${row.original.periodIn.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} + ${row.original.offsetDeposit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}` : ''}
                className="min-w-[120px]"
            />
        ),
    },
    {
        accessorKey: 'balance',
        header: ({ column }) => <ActionTableHeader label="Balance" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={row.original.balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                subLabel={row.original.offsetBalance !== 0 ? `${row.original.periodBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} + ${row.original.offsetBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}` : ''}
                className="min-w-[120px]"
            />
        ),
    },
    {
        accessorKey: 'returns',
        header: ({ column }) => <ActionTableHeader label="Returns" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={row.original.returns.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                className="min-w-[80px]"
            />
        ),
    },
    {
        accessorKey: 'netValue',
        header: ({ column }) => <ActionTableHeader label="Net Value" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={row.original.netValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                className="min-w-[80px]"
            />
        ),
    },
];

const editColumns: ColumnDef<GetMemberResponse>[] = [
    {
        accessorKey: 'joinedAt',
        header: ({ column }) => <ActionTableHeader label="Joined" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={dateFormat(new Date(row.original.joinedAt))}
                subLabel={row.original.id}
                className="min-w-[80px]"
            />
        ),
    },
];

export type MemberTableProps = {
    members: GetMembersResponse;
    handleAction: (select: null | GetMemberResponse['member'], mode?: string) => void
}

const MembersTable = ({ members, handleAction }: MemberTableProps) => {
    const [showInactive, setShowInactive] = useState(false);

    const data = useMemo(() => {
        if (showInactive) {
            return members
        }
        return members.filter((e) => e.active)
    }, [showInactive, members])

    const columns = useMemo(() => {
        if (!showInactive) {
            return baseColumns
        }
        return [
            ...baseColumns,
            ...editColumns,
            {
                accessorKey: 'member.id',
                header: () => <PlainTableHeader label="Action" />,
                cell: ({ row }) => (
                    <ActionCell onClick={() => handleAction(row.original.member)} />
                ),
            }
        ]
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showInactive]);

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
            <FilterBar
                searchValue={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onSearchChange={(value) =>
                    table.getColumn("name")?.setFilterValue(value)
                }
                onToggleChange={setShowInactive}
                toggleState={showInactive}
                onAddClick={() => handleAction(null)} />
            <TableLayout table={table} columns={columns} loading={false} />
        </div>
    );
};

export default MembersTable;
