'use client';

import React from 'react';
import { SelectInputGroup } from './select-input-group';
import { Button } from '@/components/ui/button';

type PaginationFiltersProps = {
    limit: number;
    onLimitChange: (value: number) => void;
    onReset: () => void;
};

export const PaginationFilters = ({ limit, onLimitChange, onReset }: PaginationFiltersProps) => (
    <div className='flex justify-end gap-2'>
        <SelectInputGroup
            value={limit}
            onChange={(value: number | string) => onLimitChange(Number(value))}
            placeholder="Per page"
            defaultValue='10'
            noPlaceHolderValue={true}
            options={[['10', '10/page'], ['20', '20/page'], ['30', '30/page'], ['40', '40/page'], ['50', '50/page']]}
        />
        <Button onClick={onReset} variant={'outline'} className='w-auto'>
            Clear
        </Button>
    </div>
);
