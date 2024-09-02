"use client";
import { toast } from "sonner";
import { GenericModalFooter } from "../../atoms/generic-modal";
import { MemberTransactionResponse } from "@/app/api/member-transactions/route";
import { useState } from "react";

type MemberTransactionDeleteFormProps = {
  transaction: MemberTransactionResponse;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function MemberTransactionDeleteForm({
  transaction,
  onSuccess,
  onCancel,
}: MemberTransactionDeleteFormProps) {
  const [isSubmitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/member-transactions/${transaction.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(
          `Error: ${error.message || "Failed to delete member transaction"}`,
        );
        return;
      }

      const result = await response.json();
      toast.success("Member transaction deleted successfully");
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
          Are you sure you want to delete member transactions, This action
          cannot be undone.
        </p>

        <div className="">
          <p>
            <span className="text-foreground/80">Sender: </span>
            {transaction.from.name}
          </p>
          <p>
            <span className="text-foreground/80">Receiver: </span>
            {transaction.to.name}
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
