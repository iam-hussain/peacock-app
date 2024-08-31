'use client'
import React, { ReactNode, useState } from 'react';
import { MemberForm } from './forms/member';
import { GenericModal } from './generic-modal';
import { toast } from 'sonner';
import { MemberFromSchema } from '@/lib/form-schema';
import { Dialog } from '@radix-ui/react-dialog';
import MembersTable, { MemberTableProps } from './composition/member-table';
import { GetMemberResponse, GetMembersResponse } from '@/actions/members';

const MemberAction = ({ members }: {
    members: GetMembersResponse
}) => {
    const [selected, setSelected] = useState<null | GetMemberResponse['member']>(null);
    const [isOpen, setIsOpen] = useState(false);

    async function onSubmit(data: MemberFromSchema) {
        try {
            const response = await fetch(`/api/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: selected?.id, ...data }),
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.message || "Failed to process request");
                return;
            }

            const result = await response.json();
            toast.success(selected ? "Member updated successfully" : "Member created successfully");
            setIsOpen(!isOpen)

        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
        }
    }

    const handleAction = (select: null | GetMemberResponse['member'], mode?: 'A' | "U" | "D") => {
        setSelected(select)
        setIsOpen(!isOpen)
    }
    return (
        <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
            <MembersTable members={members} handleAction={handleAction} />
            <GenericModal
                title={selected ? 'Update Member' : 'Add Member'}
                description={selected ? `Member ID: ${selected.id}` : undefined}
                actionLabel={selected ? 'Update Member' : 'Add Member'}
                onCancel={() => setIsOpen(!isOpen)}
            >
                <MemberForm member={selected} onSubmit={onSubmit} onCancel={() => setIsOpen(!isOpen)} />
            </GenericModal>
        </Dialog>
    );
};

export default MemberAction;
