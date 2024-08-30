'use client';

import React, { useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, ColumnDef, getFilteredRowModel } from '@tanstack/react-table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { TiUserAdd } from 'react-icons/ti';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AvatarCell, PlainTableHeader, ActionTableHeader, CommonTableCell, ActionCell } from '../table-helpers/table-component';
import { MdEditDocument, MdEditAttributes } from "react-icons/md";
import { dateFormat } from '@/lib/date';
import TableLayout from '../table-helpers/table-layout';
import Box from '../ui/box';
import { Toggle } from '../ui/toggle';
import { GetVendorResponse, GetVendorsResponse } from '@/actions/vendors';
import { vendorTypeMap } from '@/lib/config';
import { VendorForm } from '../forms/vendor';
import { MembersSelectResponse } from '@/actions/member-select';
import { FilterBar } from '../filter-bar-group';

const baseColumns: ColumnDef<GetVendorResponse>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => <ActionTableHeader label="Name" column={column} />,
        cell: ({ row }) => (
            <AvatarCell
                id={row.original.id}
                avatar={row.original.memberAvatar}
                name={row.original.name}
                active={row.original.active}
                subLabel={row.original.memberName}
            />
        ),
    },
    {
        accessorKey: 'startAt',
        header: ({ column }) => <ActionTableHeader label="Started At" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={dateFormat(new Date(row.original.startAt))}
                subLabel={row.original.endAt ? dateFormat(new Date(row.original.endAt)) : row.original.id}
                className="min-w-[80px]"
            />
        ),
    },
    {
        accessorKey: 'type',
        header: ({ column }) => <ActionTableHeader label="Type" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={vendorTypeMap[row.original.type]}
                subLabel={['LEND', 'CHIT'].includes(row.original.type) ? `${row.original.terms} terms` : ''}
                className="min-w-[50px]"
            />
        ),
    },
    {
        accessorKey: 'invest',
        header: ({ column }) => <ActionTableHeader label="Invest" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={row.original.invest.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                className="min-w-[80px]"
            />
        ),
    },
    {
        accessorKey: 'profit',
        header: ({ column }) => <ActionTableHeader label="Profit" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={row.original.profit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                className="min-w-[80px]"
            />
        ),
    },
    {
        accessorKey: 'returns',
        header: ({ column }) => <ActionTableHeader label="Return" column={column} />,
        cell: ({ row }) => (
            <CommonTableCell
                label={row.original.calcReturns ? row.original.returns.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : (row.original.type === 'LEND' ? row.original.returns.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : ' - ')}
                className="min-w-[80px]"
                greenLabel={row.original.calcReturns}
            />
        ),
    },
];

const editColumns: ColumnDef<GetVendorResponse>[] = [];


const VendorsTable = ({ vendors, members }: { vendors: GetVendorsResponse, members: MembersSelectResponse }) => {
    const [editMode, setEditMode] = useState(false);
    const [selected, setSelected] = useState<null | GetVendorResponse['vendor']>(null);

    const columns = useMemo(() => {
        if (!editMode) {
            return baseColumns
        }
        return [
            ...baseColumns,
            ...editColumns,
            {
                accessorKey: 'vendor.id',
                header: () => <PlainTableHeader label="Action" />,
                cell: ({ row }) => (
                    <Button variant="ghost">
                        <ActionCell onClick={() => setSelected(row.original.vendor)} />
                    </Button>
                ),
            }
        ]
    }, [editMode]);

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
                <FilterBar
                    searchValue={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onSearchChange={(value) =>
                        table.getColumn("name")?.setFilterValue(value)
                    }
                    onToggleChange={setEditMode}
                    toggleState={editMode}
                    onAddClick={() => setSelected(null)} />
                <TableLayout table={table} columns={columns} loading={false} />
                <DialogContent className="">
                    <DialogHeader>
                        <DialogTitle>{selected ? 'Update' : 'Add'} Vendor</DialogTitle>
                        {selected && <DialogDescription>Vendor ID: {selected.id}</DialogDescription>}
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <VendorForm vendor={selected} members={members} />
                    </div>
                </DialogContent>
            </div>
        </Dialog>
    );
};

export default VendorsTable;
