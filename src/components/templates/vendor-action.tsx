'use client'
import React, { useState } from 'react';
import { GenericModal } from '../atoms/generic-modal';
import { Dialog } from '@radix-ui/react-dialog';
import { VendorForm } from '../organisms/forms/vendor-form';
import VendorsTable from '../organisms/tables/vendor-table';
import { MembersSelectResponse } from '@/actions/member-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { VendorMemberConnectionsForm } from '../organisms/forms/vendor-member-connection-form';
import { VendorResponse } from '@/app/api/vendors/route';

const VendorAction = ({ members }: {
    members: MembersSelectResponse
}) => {
    const [selected, setSelected] = useState<null | VendorResponse['vendor']>(null);
    const [isOpen, setIsOpen] = useState(false);


    const handleAction = (select: null | VendorResponse['vendor'], mode?: string) => {
        setSelected(select)
        setIsOpen(true)
    }
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <VendorsTable handleAction={handleAction} />
            <GenericModal
                title={selected ? 'Update Vendor' : 'Add Vendor'}
                description={selected ? `Vendor ID: ${selected.name} [${selected.id}]` : undefined}
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
