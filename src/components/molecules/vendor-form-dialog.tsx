"use client";

import { VendorForm } from "../organisms/forms/vendor-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

import { TransformedVendor } from "@/app/api/account/vendor/route";

interface VendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected?: TransformedVendor["account"] | null;
  onSuccess?: () => void;
}

export function VendorFormDialog({
  open,
  onOpenChange,
  selected,
  onSuccess,
}: VendorFormDialogProps) {
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
              ? `Edit Vendor – ${selected.firstName} ${selected.lastName || ""}`.trim()
              : "Add Vendor"}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? "Update vendor details and information."
              : "Create a new vendor account for investment cycles."}
          </DialogDescription>
        </DialogHeader>
        <VendorForm
          selected={selected}
          onSuccess={handleSuccess}
          onCancel={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
