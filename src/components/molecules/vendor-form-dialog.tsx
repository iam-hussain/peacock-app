"use client";

import { VendorForm } from "../organisms/forms/vendor-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selected ? "Update Vendor" : "Add Vendor"}</DialogTitle>
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
