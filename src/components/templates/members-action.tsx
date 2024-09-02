"use client";
import React, { useState } from "react";
import { MemberForm } from "../organisms/forms/member-form";
import { GenericModal } from "../atoms/generic-modal";
import { Dialog } from "@radix-ui/react-dialog";
import MembersTable from "../organisms/tables/member-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { MemberVendorConnectionsForm } from "../organisms/forms/member-vendor-connection-form";
import { TransformedMember } from "@/app/api/members/route";

const MemberAction = () => {
  const [selected, setSelected] = useState<null | TransformedMember["member"]>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (
    select: null | TransformedMember["member"],
    mode?: string,
  ) => {
    setSelected(select);
    setIsOpen(!isOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <MembersTable handleAction={handleAction} />
      <GenericModal
        title={selected ? "Update Member" : "Add Member"}
        description={selected ? `Member ID: ${selected.id}` : undefined}
      >
        {selected && selected.id ? (
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
          </Tabs>
        ) : (
          <MemberForm
            selected={selected}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        )}
      </GenericModal>
    </Dialog>
  );
};

export default MemberAction;
