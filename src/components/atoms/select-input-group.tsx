'use client';

import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

type SelectInputGroupProps = {
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder: string;
    options: [string, string][];
    defaultValue?: string;
    noPlaceHolderValue?: boolean
};

export const SelectInputGroup = ({ value, onChange, placeholder, options, defaultValue = ' ', noPlaceHolderValue = false }: SelectInputGroupProps) => (
    <Select value={value.toString()} onValueChange={(e) => onChange(e)} defaultValue={defaultValue}>
        <SelectTrigger>
            <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent >
            {!noPlaceHolderValue &&
                <SelectItem value={defaultValue} className='text-muted-foreground'>
                    {placeholder}
                </SelectItem>}
            {options.map(([value, label]) => (
                <SelectItem key={value} value={value.toString()}>
                    {label}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);
