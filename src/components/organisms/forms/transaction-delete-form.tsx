"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { GenericModalFooter } from "../../atoms/generic-modal";

import { TransformedTransaction } from "@/app/api/transaction/route";
import { transactionTypeMap } from "@/lib/config";
import { dateFormat } from "@/lib/date";
import fetcher from "@/lib/fetcher";
import { moneyFormat } from "@/lib/utils";

type TransactionDeleteFormProps = {
  transaction: TransformedTransaction;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function TransactionDeleteForm({
  transaction,
  onSuccess,
  onCancel,
}: TransactionDeleteFormProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => fetcher.delete(`/api/transaction/${transaction.id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["fetch-transaction", "all-transaction"],
      });

      toast.success("Transaction deleted successfully");

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message || "Failed to delete transaction"}`);
    },
  });

  const handleDelete = async () => {
    return await mutation.mutateAsync();
  };

  return (
    <div>
      <div className="py-4 flex justify-center align-middle items-center flex-col">
        <p className="py-4 px-2 text-base">
          Are you sure you want to delete member transactions, This action
          cannot be undone.
        </p>

        <div className="flex flex-col w-full gap-2 py-4 px-2 ">
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/80">Sender:</strong>{" "}
            {transaction.from.name}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/80">Receiver:</strong>{" "}
            {transaction.to.name}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/80">Amount:</strong>{" "}
            {moneyFormat(transaction.amount)}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/80">
              Transaction Type:
            </strong>{" "}
            {transactionTypeMap[transaction.transactionType]}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/80">
              Transaction Date:
            </strong>{" "}
            {dateFormat(new Date(transaction.transactionAt))}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/80">
              Created Date:
            </strong>{" "}
            {dateFormat(new Date(transaction.createdAt))}
          </div>
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