"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { GenericModalFooter } from "../../atoms/generic-modal";

import { TransformedTransaction } from "@/app/api/transaction/route";
import { transactionTypeMap } from "@/lib/config/config";
import { dateFormat, newZoneDate } from "@/lib/core/date";
import fetcher from "@/lib/core/fetcher";
import { moneyFormat } from "@/lib/ui/utils";

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
      await queryClient.invalidateQueries({ queryKey: ["all"] });

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
            <strong className="text-sm text-foreground/70 font-medium">
              Sender:
            </strong>{" "}
            {transaction.from.name}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/70 font-medium">
              Receiver:
            </strong>{" "}
            {transaction.to.name}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/70 font-medium">
              Amount:
            </strong>{" "}
            {moneyFormat(transaction.amount)}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/70 font-medium">
              Transaction Type:
            </strong>{" "}
            {transactionTypeMap[transaction.transactionType]}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/70 font-medium">
              Transaction Date:
            </strong>{" "}
            {dateFormat(newZoneDate(transaction.occurredAt))}
          </div>
          <div className="flex justify-between text-sm border-b">
            <strong className="text-sm text-foreground/70 font-medium">
              Created Date:
            </strong>{" "}
            {dateFormat(newZoneDate(transaction.createdAt))}
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
