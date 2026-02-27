"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";

import { TransformedAccountSelect } from "@/app/api/account/select/route";
import { TransactionForm } from "@/components/organisms/forms/transaction-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { fetchAccountSelect } from "@/lib/query-options";

export default function AddTransactionPage() {
  const router = useRouter();
  const { canWrite } = useAuth();
  const { data: accounts = [], isLoading } = useQuery(fetchAccountSelect());

  const handleSuccess = () => {
    router.replace("/dashboard/transaction");
  };

  const handleCancel = () => {
    router.back();
  };

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
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold">Add Transaction</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Mobile-first flow to record member deposits, withdrawals, and
              more.
            </p>
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
        ) : isLoading ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none bg-transparent shadow-none">
            <CardContent className="p-0">
              <TransactionForm
                accounts={accounts as TransformedAccountSelect[]}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                isMobile={true}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
