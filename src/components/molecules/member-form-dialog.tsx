"use client";

import { MemberForm } from "../organisms/forms/member-form";
import { OffsetForm } from "../organisms/forms/offset-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import { TransformedMember } from "@/transformers/account";

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected?: TransformedMember["account"] | null;
  onSuccess?: () => void;
}

export function MemberFormDialog({
  open,
  onOpenChange,
  selected,
  onSuccess,
}: MemberFormDialogProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selected ? "Update Member" : "Add Member"}</DialogTitle>
        </DialogHeader>
        {selected && selected.id ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="account">Offset</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <MemberForm
                selected={selected}
                onSuccess={handleSuccess}
                onCancel={handleSuccess}
              />
            </TabsContent>
            <TabsContent value="account">
              <OffsetForm
                onSuccess={handleSuccess}
                onCancel={handleSuccess}
                passbookId={selected.passbookId || ""}
                joiningOffset={selected.joiningOffset || 0}
                delayOffset={selected.delayOffset || 0}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <MemberForm
            selected={selected}
            onSuccess={handleSuccess}
            onCancel={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
