'use client'
import React, { useState } from 'react';
import { MemberForm } from './forms/member';
import { GenericModal } from './generic-modal';
import { Dialog } from '@radix-ui/react-dialog';
import MembersTable from './composition/member-table';
import { GetMemberResponse, GetMembersResponse } from '@/actions/members';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MemberVendorConnectionsForm } from './forms/member-vendor-connection';

const MemberAction = ({ members }: {
    members: GetMembersResponse
}) => {
    const [selected, setSelected] = useState<null | GetMemberResponse['member']>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleAction = (select: null | GetMemberResponse['member'], mode?: string) => {
        setSelected(select)
        setIsOpen(!isOpen)
    }
    return (
        <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
            <MembersTable members={members} handleAction={handleAction} />
            <GenericModal
                title={selected ? 'Update Member' : 'Add Member'}
                description={selected ? `Member ID: ${selected.id}` : undefined}
                onCancel={() => setIsOpen(!isOpen)}
            >


                {selected && selected.id ?
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="account">Account</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details">
                            <MemberForm
                                selected={selected}
                                onSuccess={() => setIsOpen(false)}
                                onCancel={() => setIsOpen(false)}
                            />
                        </TabsContent>

                        <TabsContent value="account">
                            <MemberVendorConnectionsForm
                                onSuccess={() => setIsOpen(false)}
                                onCancel={() => setIsOpen(false)}
                                memberId={selected.id}
                            />
                        </TabsContent>
                    </Tabs> :
                    <MemberForm
                        selected={selected}
                        onSuccess={() => setIsOpen(false)}
                        onCancel={() => setIsOpen(false)}
                    />
                }


            </GenericModal>
        </Dialog>
    );
};

export default MemberAction;
