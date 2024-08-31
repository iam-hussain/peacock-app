// TableComponents.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { FaCircle, FaEdit } from 'react-icons/fa';
import { DialogTrigger } from '../ui/dialog';
import { AvatarGroup } from '../avatar-group';

type AvatarCellProps = {
    id: string;
    avatar?: string;
    name: string;
    active?: boolean;
    subLabel?: string;
};

export const AvatarCell = ({ id, avatar, name, active, subLabel }: AvatarCellProps) => (
    <div className="flex items-center space-x-2 min-w-[170px]" data-id={id}>
        <AvatarGroup src={avatar || ''} name={name} active={active || false} />
        <div className='flex flex-col'>
            <p className='text-foreground font-medium'>{name}</p>
            {subLabel && <p className='text-[0.7rem] text-foreground/70'>{subLabel}</p>}
        </div>
    </div>
);

type TableHeaderProps = {
    label: string;
};

export const PlainTableHeader = ({ label }: TableHeaderProps) => (
    <div className="text-xs uppercase hover:bg-transparent hover:font-extrabold px-2">
        {label}
    </div>
);

export const ActionTableHeader = ({ label, column, onClick }: TableHeaderProps & { column: Column<any>, onClick?: (id: any) => void }) => {

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => onClick ? onClick(column.id) : column.toggleSorting(column.getIsSorted() === 'asc')}
            className="uppercase hover:bg-transparent hover:font-extrabold px-2"
        >
            {label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    )
};

type CommonTableCellProps = {
    label: string;
    subLabel?: string;
    className?: string;
    greenLabel?: boolean
};

export const CommonTableCell = ({ label, subLabel, className, greenLabel = false }: CommonTableCellProps) => (
    <div className={cn('flex flex-col items-start min-w-[120px]', className)}>
        <p className={cn('text-foreground font-medium', {
            'text-emerald-500': greenLabel
        })}>{label}</p>
        {subLabel && <p className='text-[0.7rem] text-foreground/70 m-0'>{subLabel}</p>}
    </div>
);

type ActionCellProps = {
    onClick: () => void;
};

export const ActionCell = ({ onClick }: ActionCellProps) => (
    <Button variant={'ghost'} className='px-3 py-1' onClick={onClick}>
        <FaEdit className='h-4 w-4' />
    </Button>
);

type PaginationControlsProps = {
    page: number;
    totalPages: number;
    loading: boolean;
    setPage: (page: number) => void;
};

export const PaginationControls = ({ page, totalPages, loading, setPage }: PaginationControlsProps) => (
    <div className="mt-4 flex justify-between align-middle items-center gap-4">
        <Button onClick={() => setPage(page - 1)} disabled={page === 1 || loading} variant={'outline'} className='min-w-[100px]'>
            Previous
        </Button>
        <span className='text-sm text-foreground/90'>Page {page} of {totalPages}</span>
        <Button onClick={() => setPage(page + 1)} disabled={page === totalPages || loading} variant={'outline'} className='min-w-[100px]'>
            Next
        </Button>
    </div>
);
