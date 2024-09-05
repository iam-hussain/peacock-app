"use client";
import { Dialog } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";

import { GenericModal } from "../atoms/generic-modal";
import { MemberTransactionDeleteForm } from "../organisms/forms/member-transaction-delete-form";
import { MemberTransactionForm } from "../organisms/forms/member-transaction-form";
import MembersTransactionTable from "../organisms/tables/member-transaction-table";
import Box from "../ui/box";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Typography from "../ui/typography";

import { TransformedMemberTransaction } from "@/app/api/member/transaction/route";
import { fetchMembersSelect } from "@/lib/query-options";

const MemberTransactionsAction = () => {
  const { data: members = [] } = useQuery(fetchMembersSelect());
  const [selected, setSelected] = useState<null | TransformedMemberTransaction>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (select: null | TransformedMemberTransaction) => {
    setSelected(select);
    setIsOpen(!isOpen);
  };
  return (
    <Box preset={"stack-start"}>
      <Box preset={"row-between"} className="px-4 md:px-6">
        <Typography variant={"h3"} className="">
          Member Transactions
        </Typography>
        <Button variant="secondary" onClick={() => handleAction(null)}>
          Add Transaction
        </Button>
      </Box>
      <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
        <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
          <MembersTransactionTable
            members={members}
            handleAction={handleAction}
          />
          <GenericModal
            title={selected ? "Member Transactions" : "Add Member Transactions"}
            description={selected ? `Member ID: ${selected.id}` : undefined}
          >
            {selected && selected.id ? (
              <Tabs defaultValue="update" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="update">Update</TabsTrigger>
                  <TabsTrigger value="delete">Delete</TabsTrigger>
                </TabsList>
                <TabsContent value="update">
                  <MemberTransactionForm
                    selected={selected}
                    onSuccess={() => setIsOpen(false)}
                    onCancel={() => setIsOpen(false)}
                    members={members}
                  />
                </TabsContent>

                <TabsContent value="delete">
                  <MemberTransactionDeleteForm
                    transaction={selected}
                    onSuccess={() => setIsOpen(false)}
                    onCancel={() => setIsOpen(false)}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <MemberTransactionForm
                selected={selected}
                onSuccess={() => setIsOpen(false)}
                onCancel={() => setIsOpen(false)}
                members={members}
              />
            )}
          </GenericModal>
        </Dialog>
      </Box>
    </Box>
  );
};

export default MemberTransactionsAction;
