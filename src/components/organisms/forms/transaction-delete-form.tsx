"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { TransformedTransaction } from "@/app/api/transaction/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { transactionTypeHumanMap } from "@/lib/config/config";
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
  const [confirmText, setConfirmText] = useState("");

  const transactionType =
    transaction.transactionType || (transaction as any).type;

  const { amountColor, amountPrefix } = useMemo(() => {
    const inflowTypes = [
      "PERIODIC_DEPOSIT",
      "OFFSET_DEPOSIT",
      "REJOIN",
      "VENDOR_RETURNS",
      "LOAN_REPAY",
      "LOAN_INTEREST",
    ];
    const outflowTypes = ["WITHDRAW", "VENDOR_INVEST", "LOAN_TAKEN"];
    const isInflow = inflowTypes.includes(transactionType);
    const isOutflow = outflowTypes.includes(transactionType);
    return {
      amountColor: isInflow
        ? "text-success-foreground"
        : isOutflow
          ? "text-destructive"
          : "text-foreground",
      amountPrefix: isInflow ? "+" : isOutflow ? "−" : "",
    };
  }, [transactionType]);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          {/* simple warning icon substitute */}
          <span className="text-lg font-bold">!</span>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">
            Delete Transaction
          </p>
          <p className="text-sm text-muted-foreground">
            This action is permanent and cannot be undone.
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border border-border/50 rounded-2xl shadow-sm bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Sender</p>
              <p className="font-medium truncate">{transaction.from.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Receiver</p>
              <p className="font-medium truncate">{transaction.to.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Amount</p>
              <p
                className={`text-lg font-semibold tabular-nums ${amountColor}`}
              >
                {amountPrefix}
                {moneyFormat(transaction.amount)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Transaction Type</p>
              <Badge
                variant="secondary"
                className="w-fit rounded-full px-3 py-1 text-xs font-medium"
              >
                {transactionTypeHumanMap[transactionType] || transactionType}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Transaction Date</p>
              <p className="font-medium">
                {dateFormat(newZoneDate(transaction.occurredAt))}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Created Date</p>
              <p className="font-medium">
                {dateFormat(newZoneDate(transaction.createdAt))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Type DELETE to confirm
        </label>
        <Input
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder="DELETE"
          className="h-10"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={mutation.isPending || confirmText !== "DELETE"}
        >
          {mutation.isPending ? "Deleting..." : "Delete Transaction"}
        </Button>
      </div>
    </div>
  );
}
