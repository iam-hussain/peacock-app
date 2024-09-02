"use client";
import { toast } from "sonner";
import { GenericModalFooter } from "../../atoms/generic-modal";
import { TransformedVendorTransaction } from "@/app/api/vendor-transactions/route";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

type VendorTransactionDeleteFormProps = {
  transaction: TransformedVendorTransaction;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function VendorTransactionDeleteForm({
  transaction,
  onSuccess,
  onCancel,
}: VendorTransactionDeleteFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/vendor-transactions/${transaction.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(
          `Error: ${error.message || "Failed to delete vendor transaction"}`,
        );
        return;
      }

      const result = await response.json();
      toast.success("Vendor transaction deleted successfully");

      queryClient.invalidateQueries({
        queryKey: ["vendor-transactions"],
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div>
      <div className="py-4 flex justify-center align-middle items-center flex-col">
        <p className="py-4 px-2">
          Are you sure you want to delete vendor transactions, This action
          cannot be undone.
        </p>

        <div className="">
          <p>
            <span className="text-foreground/80">Vendor: </span>
            {transaction.vendor.name}
          </p>
          <p>
            <span className="text-foreground/80">Member: </span>
            {transaction.member.name}
          </p>
          <p>
            <span className="text-foreground/80">Amount: </span>
            {transaction.amount}
          </p>
        </div>
      </div>
      <GenericModalFooter
        isDelete={true}
        actionLabel={"Delete"}
        onCancel={onCancel}
        onConfirm={handleDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
