"use client";
import { Dialog } from "@radix-ui/react-dialog";
import React, { useState } from "react";

import { GenericModal } from "../atoms/generic-modal";
import { VendorForm } from "../organisms/forms/vendor-form";
import VendorsTable from "../organisms/tables/vendor-table";

import { TransformedVendor } from "@/app/api/account/vendor/route";

const VendorAction = () => {
  const [selected, setSelected] = useState<null | TransformedVendor["account"]>(
    null
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (select: null | TransformedVendor["account"]) => {
    setSelected(select);
    setIsOpen(true);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <VendorsTable handleAction={handleAction} />
      <GenericModal
        title={selected ? "Update Vendor" : "Add Vendor"}
        description={
          selected
            ? `Vendor ID: ${selected?.firstName} - [${selected.id}]`
            : undefined
        }
      >
        <VendorForm
          selected={selected}
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </GenericModal>
    </Dialog>
  );
};

export default VendorAction;
