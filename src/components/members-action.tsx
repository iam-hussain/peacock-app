'use client'
import React, { useRef, useState } from 'react';
import { MemberForm } from './forms/member';
import { GenericModal } from './generic-modal';
import { Dialog } from '@radix-ui/react-dialog';
import MembersTable from './composition/member-table';
import { GetMemberResponse, GetMembersResponse } from '@/actions/members';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MemberVendorConnectionsForm } from './forms/member-vendor-connection';
import html2canvas from 'html2canvas';
import { Button } from './ui/button';

const MemberAction = ({ members }: {
    members: GetMembersResponse
}) => {
    const captureRef = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState<null | GetMemberResponse['member']>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [captureMode, setCaptureMode] = useState(false);


    const captureTable = async () => {
        if (captureRef.current) {
            setCaptureMode(true);
            const canvas = await html2canvas(captureRef.current, {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
            });
            setCaptureMode(false);
            const capturedImage = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `member-${new Date().toISOString()}.png`;
            link.href = capturedImage;
            link.click();
        }
    };

    const handleAction = (select: null | GetMemberResponse['member'], mode?: string) => {
        setSelected(select);
        setIsOpen(!isOpen);
        captureTable()
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
            <MembersTable members={members} handleAction={handleAction} />
            <GenericModal
                title={selected ? 'Update Member' : 'Add Member'}
                description={selected ? `Member ID: ${selected.id}` : undefined}
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
