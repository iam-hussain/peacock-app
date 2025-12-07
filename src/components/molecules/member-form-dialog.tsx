"use client";

import { MemberForm } from "../organisms/forms/member-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selected
              ? `Edit Member – ${selected.firstName} ${selected.lastName || ""}`.trim()
              : "Add Member"}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? "Update member details and information."
              : "Create a new member account for the club."}
          </DialogDescription>
        </DialogHeader>
        <MemberForm
          selected={selected}
          onSuccess={handleSuccess}
          onCancel={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
