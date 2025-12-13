"use client";

import { Card, CardContent } from "../ui/card";

import { moneyFormat } from "@/lib/ui/utils";

interface TransactionSummaryCardProps {
  inflow: number;
  outflow: number;
}

export function TransactionSummaryCard({
  inflow,
  outflow,
}: TransactionSummaryCardProps) {
  return (
    <div className="w-full flex justify-center">
      <Card className="w-full max-w-md border-border/50 bg-card shadow-sm rounded-xl">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Inflow
              </p>
              <p className="text-lg font-bold text-green-600 dark:text-green-500 md:text-xl">
                {moneyFormat(inflow)}
              </p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex-1 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Outflow
              </p>
              <p className="text-lg font-bold text-destructive md:text-xl">
                {moneyFormat(outflow)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
