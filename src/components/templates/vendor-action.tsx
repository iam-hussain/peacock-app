"use client";
import React, { useState } from "react";
import { GenericModal } from "../atoms/generic-modal";
import { Dialog } from "@radix-ui/react-dialog";
import { VendorForm } from "../organisms/forms/vendor-form";
import VendorsTable from "../organisms/tables/vendor-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { VendorConnectionsForm } from "../organisms/forms/vendor-connection-form";
import { TransformedVendor } from "@/app/api/vendor/route";
import { fetchMembersSelect } from "@/lib/query-options";
import { useQuery } from "@tanstack/react-query";

const VendorAction = () => {
  const { data: members = [] } = useQuery(fetchMembersSelect());
  const [selected, setSelected] = useState<null | TransformedVendor["vendor"]>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (
    select: null | TransformedVendor["vendor"],
    mode?: string,
  ) => {
    setSelected(select);
    setIsOpen(true);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <VendorsTable handleAction={handleAction} />
      <GenericModal
        title={selected ? "Update Vendor" : "Add Vendor"}
        description={
          selected ? `Vendor ID: ${selected.name} [${selected.id}]` : undefined
        }
      >
        {selected && selected.id ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="account">Connection</TabsTrigger>
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
              <VendorConnectionsForm
                onSuccess={() => setIsOpen(false)}
                onCancel={() => setIsOpen(false)}
                vendorId={selected.id}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <VendorForm
            selected={selected}
            members={members}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        )}
      </GenericModal>
    </Dialog>
  );
};

export default VendorAction;
