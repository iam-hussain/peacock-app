'use client';

import React from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, ColumnDef, getFilteredRowModel } from '@tanstack/react-table';
import { GetMembersResponse, GetMemberResponse } from '@/actions/members';
import { AvatarCell, ActionTableHeader, CommonTableCell } from '../table-helpers/table-component';
import TableLayout from '../table-helpers/table-layout';

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


export type MemberTableCapProps = {
    members: GetMembersResponse;
}

const MembersTableCap = ({ members }: MemberTableCapProps) => {

    const data = members.filter((e) => e.active)

    const columns = baseColumns

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
            <TableLayout table={table} columns={columns} loading={false} />
        </div>
    );
};

export default MembersTableCap;
