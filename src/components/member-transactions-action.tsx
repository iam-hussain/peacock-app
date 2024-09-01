'use client'
import React, { useState } from 'react';
import { GenericModal } from './generic-modal';
import { Dialog } from '@radix-ui/react-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import MembersTransactionTable from './composition/member-transaction-table';
import { MemberTransactionResponse } from '@/app/api/member-transactions/route';
import { MembersSelectResponse } from '@/actions/member-select';
import { MemberTransactionForm } from './forms/member-transaction';
import Typography from './ui/typography';
import Box from './ui/box';
import { Button } from './ui/button';
import { MemberTransactionDeleteForm } from './forms/member-transaction-delete';

const MemberTransactionsAction = ({ members }: {
    members: MembersSelectResponse
}) => {
    const [selected, setSelected] = useState<null | MemberTransactionResponse>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleAction = (select: null | MemberTransactionResponse, mode?: string) => {
        setSelected(select)
        setIsOpen(!isOpen)
    }
    return (
        <Box preset={'stack-start'} >
            <Box preset={'row-between'} className="px-4 md:px-6">
                <Typography variant={'h3'} className="">Member Transactions</Typography>
                <Button variant='secondary' onClick={() => handleAction(null)}>Add Transaction</Button>
            </Box>
            <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
                <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
                    <MembersTransactionTable members={members} handleAction={handleAction} />
                    <GenericModal
                        title={selected ? 'Member Transactions' : 'Add Member Transactions'}
                        description={selected ? `Member ID: ${selected.id}` : undefined}
                    >

                        {selected && selected.id ?
                            <Tabs defaultValue="update" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="update">Update</TabsTrigger>
                                    <TabsTrigger value="delete">Delete</TabsTrigger>
                                </TabsList>
                                <TabsContent value="update">
                                    <MemberTransactionForm
                                        selected={selected}
                                        onSuccess={() => setIsOpen(false)}
                                        onCancel={() => setIsOpen(false)} members={members}
                                    />
                                </TabsContent>

                                <TabsContent value="delete">
                                    <MemberTransactionDeleteForm
                                        transaction={selected}
                                        onSuccess={() => setIsOpen(false)}
                                        onCancel={() => setIsOpen(false)}
                                    />
                                </TabsContent>
                            </Tabs> :
                            <MemberTransactionForm
                                selected={selected}
                                onSuccess={() => setIsOpen(false)}
                                onCancel={() => setIsOpen(false)} members={members}
                            />
                        }

                    </GenericModal>
                </Dialog>
            </Box>
        </Box>
    );
};

export default MemberTransactionsAction;
