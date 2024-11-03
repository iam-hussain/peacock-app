"use client";
import { Dialog } from "@radix-ui/react-dialog";
import React, { useState } from "react";

import { GenericModal } from "../atoms/generic-modal";
import { MemberConnectionsForm } from "../organisms/forms/member-connection-form";
import { MemberForm } from "../organisms/forms/member-form";
import MembersTable from "../organisms/tables/member-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import { TransformedMember } from "@/app/api/member/route";

const MemberAction = () => {
  const [selected, setSelected] = useState<null | TransformedMember["member"]>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (select: null | TransformedMember["member"]) => {
    setSelected(select);
    setIsOpen(!isOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <MembersTable handleAction={handleAction} />
      <GenericModal
        title={selected ? "Update Member" : "Add Member"}
        description={
          selected
            ? `Member ID: ${selected.firstName} ${selected?.lastName || ""} - [${selected.id}]`.trim()
            : undefined
        }
      >
        {selected && selected.id ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="account">Connection</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <MemberForm
                selected={selected}
                onSuccess={() => setIsOpen(false)}
                onCancel={() => setIsOpen(false)}
              />
            </TabsContent>

            <TabsContent value="account">
              <MemberConnectionsForm
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
