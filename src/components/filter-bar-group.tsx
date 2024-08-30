'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import Box from '@/components/ui/box';
import { MdDeleteOutline, MdDeleteForever } from "react-icons/md";
import { TiUserAdd } from 'react-icons/ti';
import { DialogTrigger } from '@/components/ui/dialog';
import { IconType } from 'react-icons/lib';

type FilterBarProps = {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onToggleChange: (value: boolean) => void;
    toggleState: boolean;
    onAddClick: () => void;
    toggleIcons?: { TrueIcon: IconType; FalseIcon: IconType };
    searchPlaceholder?: string;
    children?: React.ReactNode
};

export const FilterBar = ({ children, searchValue, onSearchChange, onToggleChange, toggleState, onAddClick, toggleIcons, searchPlaceholder = "Filter names..." }: FilterBarProps) => {

    const { TrueIcon = MdDeleteForever, FalseIcon = MdDeleteOutline } = toggleIcons || {};

    return (
        <div className="flex justify-between mb-4 gap-3 px-2">
            <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                className="max-w-sm"
            />
            <Box className='w-auto gap-4'>
                {children}
                <Toggle aria-label="Toggle" onPressedChange={onToggleChange} className='gap-2'>
                    {toggleState ? (<TrueIcon className='w-6 h-6' />) : <FalseIcon className='w-6 h-6' />}
                </Toggle>
                <DialogTrigger asChild>
                    <Button variant="outline" onClick={onAddClick}>
                        <TiUserAdd className='w-6 h-6' />
                    </Button>
                </DialogTrigger>
            </Box>
        </div>
    )
};
