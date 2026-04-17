"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";

import { TransformedAccountSelect } from "@/app/api/account/select/route";
import { TransactionForm } from "@/components/organisms/forms/transaction-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4 md:px-6 md:pt-8">
        <div className="mb-4 flex items-center gap-2 md:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="mb-6 flex items-start gap-3 md:mb-8 md:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-12 md:w-12">
            <Receipt className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Add Transaction
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Record deposits, withdrawals, transfers, loans, and vendor
              movements.
            </p>
          </div>
        </div>

        {!canWrite ? (
          <Card>
            <CardContent className="space-y-3 p-6">
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
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 md:p-6">
              <TransactionForm
                accounts={accounts as TransformedAccountSelect[]}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                isMobile={false}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
