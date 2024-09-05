"use client";
import { Dialog } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";

import { GenericModal } from "../atoms/generic-modal";
import { VendorTransactionDeleteForm } from "../organisms/forms/vendor-transaction-delete-form";
import { VendorTransactionForm } from "../organisms/forms/vendor-transaction-form";
import VendorsTransactionTable from "../organisms/tables/vendor-transaction-table";
import Box from "../ui/box";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Typography from "../ui/typography";

import { TransformedVendorTransaction } from "@/app/api/vendor/transaction/route";
import { fetchMembersSelect, fetchVendorsSelect } from "@/lib/query-options";

const VendorTransactionsAction = () => {
  const { data: members = [] } = useQuery(fetchMembersSelect());
  const { data: vendors = [] } = useQuery(fetchVendorsSelect());
  const [selected, setSelected] = useState<null | TransformedVendorTransaction>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (select: null | TransformedVendorTransaction) => {
    setSelected(select);
    setIsOpen(!isOpen);
  };
  return (
    <Box preset={"stack-start"}>
      <Box preset={"row-between"} className="px-4 md:px-6">
        <Typography variant={"h3"} className="">
          Vendor Transactions
        </Typography>
        <Button variant="secondary" onClick={() => handleAction(null)}>
          Add Transaction
        </Button>
      </Box>
      <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
        <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
          <VendorsTransactionTable
            vendors={vendors}
            handleAction={handleAction}
            members={members}
          />
          <GenericModal
            title={selected ? "Vendor Transactions" : "Add Vendor Transactions"}
            description={selected ? `Vendor ID: ${selected.id}` : undefined}
          >
            {selected && selected.id ? (
              <Tabs defaultValue="update" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="update">Update</TabsTrigger>
                  <TabsTrigger value="delete">Delete</TabsTrigger>
                </TabsList>
                <TabsContent value="update">
                  <VendorTransactionForm
                    selected={selected}
                    onSuccess={() => setIsOpen(false)}
                    onCancel={() => setIsOpen(false)}
                    vendors={vendors}
                    members={members}
                  />
                </TabsContent>

                <TabsContent value="delete">
                  <VendorTransactionDeleteForm
                    transaction={selected}
                    onSuccess={() => setIsOpen(false)}
                    onCancel={() => setIsOpen(false)}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <VendorTransactionForm
                selected={selected}
                onSuccess={() => setIsOpen(false)}
                onCancel={() => setIsOpen(false)}
                vendors={vendors}
                members={members}
              />
            )}
          </GenericModal>
        </Dialog>
      </Box>
    </Box>
  );
};

export default VendorTransactionsAction;
