'use client'
import React, { useState } from 'react';
import { GenericModal } from './generic-modal';
import { Dialog } from '@radix-ui/react-dialog';
import { VendorForm } from './forms/vendor';
import { GetVendorResponse, GetVendorsResponse } from '@/actions/vendors';
import VendorsTable from './composition/vendor-table';
import { MembersSelectResponse } from '@/actions/member-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { VendorMemberConnectionsForm } from './forms/vendor-member-connection';

const VendorAction = ({ members, vendors }: {
    members: MembersSelectResponse
    vendors: GetVendorsResponse
}) => {
    const [selected, setSelected] = useState<null | GetVendorResponse['vendor']>(null);
    const [isOpen, setIsOpen] = useState(false);


    const handleAction = (select: null | GetVendorResponse['vendor'], mode?: string) => {
        setSelected(select)
        setIsOpen(true)
    }
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <VendorsTable vendors={vendors} handleAction={handleAction} />
            <GenericModal
                title={selected ? 'Update Vendor' : 'Add Vendor'}
                description={selected ? `Vendor ID: ${selected.name} [${selected.id}]` : undefined}
                actionLabel={selected ? 'Update Vendor' : 'Add Vendor'}
                onCancel={() => setIsOpen(!isOpen)}
            >

                {selected && selected.id ?
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="account">Account</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details">
                            <VendorForm
                                selected={selected}
                                members={members}
                                onSuccess={() => setIsOpen(false)}
                                onCancel={() => setIsOpen(false)}
                            />
                        </TabsContent>

                        <TabsContent value="account">
                            <VendorMemberConnectionsForm
                                onSuccess={() => setIsOpen(false)}
                                onCancel={() => setIsOpen(false)}
                                vendorId={selected.id}
                            />
                        </TabsContent>
                    </Tabs> :
                    <VendorForm
                        selected={selected}
                        members={members}
                        onSuccess={() => setIsOpen(false)}
                        onCancel={() => setIsOpen(false)}
                    />
                }

            </GenericModal>
        </Dialog>
    );
};

export default VendorAction;
