"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";

import { TransactionForm } from "@/components/organisms/forms/transaction-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { fetchAccountSelect, fetchTransactionById } from "@/lib/query-options";
import { moneyFormat } from "@/lib/ui/utils";

export default function EditTransactionPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { canWrite } = useAuth();
  const { id } = params;

  const { data: accounts = [], isLoading: accountsLoading } =
    useQuery(fetchAccountSelect());
  const {
    data: transactionData,
    isLoading: transactionLoading,
    isError,
  } = useQuery(fetchTransactionById(id));

  const transaction = transactionData?.transaction;

  const handleSuccess = () => {
    router.replace("/dashboard/transaction");
  };

  const handleCancel = () => {
    router.back();
  };

  const isLoading = accountsLoading || transactionLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-10 pt-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-border"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to transactions</span>
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <PencilLine className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold">Edit Transaction</h1>
            </div>
            {transaction && (
              <p className="text-sm text-muted-foreground">
                {moneyFormat(transaction.amount)} •{" "}
                {transaction.transactionType}
              </p>
            )}
          </div>
        </div>

        {!canWrite ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm text-muted-foreground">
                You have read-only access. Contact an admin to request write
                access.
              </p>
              <Button
                onClick={handleCancel}
                variant="secondary"
                className="w-full"
              >
                Back to transactions
              </Button>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-medium text-destructive">
                We couldn&apos;t load this transaction.
              </p>
              <Button
                onClick={handleCancel}
                variant="secondary"
                className="w-full"
              >
                Back to transactions
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
            </CardContent>
          </Card>
        ) : transaction ? (
          <Card className="border-none bg-transparent shadow-none">
            <CardContent className="p-0">
              <TransactionForm
                accounts={accounts}
                selected={transaction as any}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                isMobile={true}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Transaction not found.
              </p>
              <Button
                onClick={handleCancel}
                variant="secondary"
                className="w-full"
              >
                Back to transactions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
