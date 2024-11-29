"use client";
import { Dialog } from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";

import { GenericModal } from "../atoms/generic-modal";
import { MemberForm } from "../organisms/forms/member-form";
import { OffsetForm } from "../organisms/forms/offset-form";
import MembersTable from "../organisms/tables/member-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import { TransformedMember } from "@/transformers/account";

const MemberAction = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<null | TransformedMember["account"]>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (select: null | TransformedMember["account"]) => {
    setSelected(select);
    setIsOpen(!isOpen);
  };

  const onSuccess = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["member-details"],
    });
    setIsOpen(false);
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
              <TabsTrigger value="account">Offset</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <MemberForm
                selected={selected}
                onSuccess={onSuccess}
                onCancel={onSuccess}
              />
            </TabsContent>

            <TabsContent value="account">
              <OffsetForm
                onSuccess={() => setIsOpen(false)}
                onCancel={() => setIsOpen(false)}
                passbookId={selected.passbookId || ""}
                joiningOffset={selected.joiningOffset || 0}
                delayOffset={selected.delayOffset || 0}
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
