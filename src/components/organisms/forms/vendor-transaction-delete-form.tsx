"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { GenericModalFooter } from "../../atoms/generic-modal";

import { TransformedVendorTransaction } from "@/app/api/vendor/transaction/route";
import fetcher from "@/lib/fetcher";

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

  const mutation = useMutation({
    mutationFn: () =>
      fetcher.delete(`/api/vendor/transaction/${transaction.id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["vendor-transaction"],
      });

      toast.success("Vendor transaction deleted successfully");

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
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
