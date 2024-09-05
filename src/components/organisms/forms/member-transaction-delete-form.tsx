"use client";
import { toast } from "sonner";
import { GenericModalFooter } from "../../atoms/generic-modal";
import { TransformedMemberTransaction } from "@/app/api/member/transaction/route";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import fetcher from "@/lib/fetcher";

type MemberTransactionDeleteFormProps = {
  transaction: TransformedMemberTransaction;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function MemberTransactionDeleteForm({
  transaction,
  onSuccess,
  onCancel,
}: MemberTransactionDeleteFormProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      fetcher.delete(`/api/member/transaction/${transaction.id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["member-transaction"],
      });

      toast.success("Member transaction deleted successfully");

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(
        `Error: ${error.message || "Failed to delete member transaction"}`,
      );
    },
  });

  const handleDelete = async () => {
    return await mutation.mutateAsync();
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
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
