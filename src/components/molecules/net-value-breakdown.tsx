"use client";

import { ArrowRight, Minus, Plus } from "lucide-react";

import { Card, CardContent } from "../ui/card";

import { TransformedStatistics } from "@/app/api/statistics/route";
import { moneyFormat } from "@/lib/ui/utils";
import { cn } from "@/lib/ui/utils";

interface NetValueBreakdownProps {
  statistics: TransformedStatistics;
}

export function NetValueBreakdown({ statistics }: NetValueBreakdownProps) {
  const availableCash = statistics.currentClubBalance || 0;
  const invested = statistics.totalLoanBalance + statistics.totalVendorHolding;
  const loanTaken = statistics.totalLoanBalance;
  const pending =
    statistics.totalInterestBalance +
    statistics.totalOffsetBalance +
    statistics.totalMemberPeriodicDepositsBalance;

  const assets = availableCash + invested;
  const liabilities = loanTaken + pending;
  const netValue = statistics.currentClubNetValue;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        NET VALUE BREAKDOWN
      </h3>

      {/* Visual Flow */}
      <Card className="rounded-lg border border-border/50 bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Assets Row */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                  Assets
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ValuePill
                  label="Available Cash"
                  value={availableCash}
                  color="green"
                />
                <Plus className="h-4 w-4 text-muted-foreground" />
                <ValuePill label="Invested" value={invested} color="green" />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <ValuePill
                  label="Total Assets"
                  value={assets}
                  color="green"
                  isTotal
                />
              </div>
            </div>

            {/* Liabilities Row */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400">
                  Liabilities
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ValuePill
                  label="Loan Taken"
                  value={loanTaken}
                  color="orange"
                />
                <Plus className="h-4 w-4 text-muted-foreground" />
                <ValuePill label="Pending" value={pending} color="orange" />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <ValuePill
                  label="Total Liabilities"
                  value={liabilities}
                  color="orange"
                  isTotal
                />
              </div>
            </div>

            {/* Net Value Calculation */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <ValuePill
                  label="Total Assets"
                  value={assets}
                  color="green"
                  isTotal
                />
                <Minus className="h-4 w-4 text-muted-foreground" />
                <ValuePill
                  label="Total Liabilities"
                  value={liabilities}
                  color="orange"
                  isTotal
                />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <ValuePill
                  label="Net Value"
                  value={netValue}
                  color="primary"
                  isTotal
                  isHighlight
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ValuePillProps {
  label: string;
  value: number;
  color: "green" | "orange" | "primary";
  isTotal?: boolean;
  isHighlight?: boolean;
}

function ValuePill({
  label,
  value,
  color,
  isTotal = false,
  isHighlight = false,
}: ValuePillProps) {
  const colorClasses = {
    green:
      "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
    orange:
      "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-100",
    primary:
      "bg-primary/10 border-primary/20 text-primary-foreground dark:bg-primary/20 dark:border-primary/30",
  };

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-center transition-shadow",
        colorClasses[color],
        isHighlight && "ring-2 ring-primary/20 shadow-md",
        isTotal && "font-semibold"
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-bold",
          isTotal ? "text-base" : "text-sm",
          isHighlight && "text-lg"
        )}
      >
        {moneyFormat(value)}
      </p>
    </div>
  );
}
