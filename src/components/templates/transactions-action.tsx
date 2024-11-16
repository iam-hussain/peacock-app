"use client";
import { Dialog } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";

import { GenericModal } from "../atoms/generic-modal";
import { TransactionDeleteForm } from "../organisms/forms/transaction-delete-form";
import { TransactionForm } from "../organisms/forms/transaction-form";
import TransactionTable from "../organisms/tables/transaction-table";
import Box from "../ui/box";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Typography from "../ui/typography";

import { TransformedTransaction } from "@/app/api/transaction/route";
import { fetchAccountSelect } from "@/lib/query-options";

const TransactionsAction = () => {
  const { data: accounts = [] } = useQuery(fetchAccountSelect());
  const [selected, setSelected] = useState<null | TransformedTransaction>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [members, vendors] = useMemo(() => {
    return [
      accounts.filter((e) => e.isMember),
      accounts.filter((e) => !e.isMember),
    ];
  }, [accounts]);

  const handleAction = (select: null | TransformedTransaction) => {
    setSelected(select);
    setIsOpen(!isOpen);
  };
  return (
    <Box preset={"stack-start"}>
      <Box preset={"row-between"} className="px-4 md:px-6">
        <Typography variant={"h3"} className="">
          Transactions
        </Typography>
        <Button variant="secondary" onClick={() => handleAction(null)}>
          Add Transaction
        </Button>
      </Box>
      <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
        <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
          <TransactionTable accounts={accounts} handleAction={handleAction} />
          <GenericModal
            title={selected ? "Transactions" : "Add Transactions"}
            description={
              selected ? `Transactions ID: ${selected.id}` : undefined
            }
          >
            <p>H</p>
            {/* {selected && selected.id ? (
              <Tabs defaultValue="update" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="update">Update</TabsTrigger>
                  <TabsTrigger value="delete">Delete</TabsTrigger>
                </TabsList>
                <TabsContent value="update">
                  <TransactionForm
                    selected={selected}
                    onSuccess={() => setIsOpen(false)}
                    onCancel={() => setIsOpen(false)}
                    vendors={vendors}
                    members={members}
                  />
                </TabsContent>

                <TabsContent value="delete">
                  <TransactionDeleteForm
                    transaction={selected}
                    onSuccess={() => setIsOpen(false)}
                    onCancel={() => setIsOpen(false)}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <TransactionForm
                selected={selected}
                onSuccess={() => setIsOpen(false)}
                onCancel={() => setIsOpen(false)}
                vendors={vendors}
                members={members}
              />
            )} */}
          </GenericModal>
        </Dialog>
      </Box>
    </Box>
  );
};

export default TransactionsAction;
