'use client';

import React, { ReactNode } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from './ui/scroll-area';

type GenericModalFooterProps = {
    actionLabel: string;
    onCancel?: () => void
    onConfirm?: () => void;
    isDelete?: boolean;
};

export const GenericModalFooter = ({ actionLabel, onCancel, onConfirm, isDelete }: GenericModalFooterProps) => {
    return (
        <DialogFooter className='gap-2 flex sm:flex-row flex-row justify-between'>
            <Button variant="outline" onClick={onCancel} className='min-w-[140px]'>Cancel</Button>
            <Button type={isDelete ? "button" : "submit"} variant={isDelete ? "destructive" : 'default'} className='min-w-[140px]' onClick={onConfirm}>
                {actionLabel}
            </Button>
        </DialogFooter>
    );
};


type GenericModalProps = {
    title: string;
    description?: string;
    actionLabel: string;
    onCancel?: () => void
    onConfirm?: () => void;
    children: ReactNode;
    isDelete?: boolean;
};

export const GenericModal = ({ title, description, actionLabel, onCancel, onConfirm, children, isDelete }: GenericModalProps) => {
    return (
        <DialogContent className='h-auto max-h-svh flex flex-col overflow-auto'>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            <div className='h-auto'>
                {children}
            </div>
            {isDelete && <GenericModalFooter actionLabel={actionLabel} onCancel={onCancel} onConfirm={onConfirm} isDelete={isDelete} />}
        </DialogContent>
    );
};
