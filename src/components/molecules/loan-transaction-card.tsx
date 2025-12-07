"use client";

import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Percent,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Separator } from "../ui/separator";

import { dateFormat, newZoneDate } from "@/lib/date";
import { LoanHistoryEntry } from "@/lib/type";
import { moneyFormat } from "@/lib/utils";

interface LoanTransactionCardProps {
  transaction: LoanHistoryEntry;
  index: number;
}

export function LoanTransactionCard({
  transaction,
  index,
}: LoanTransactionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-border/50 bg-card shadow-sm transition-all hover:shadow-md">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-sm font-semibold">#{index + 1}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Loan Cycle #{index + 1}
                </span>
                <Badge
                  variant={transaction.active ? "default" : "secondary"}
                  className={
                    transaction.active
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                      : ""
                  }
                >
                  {transaction.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {dateFormat(newZoneDate(transaction.startDate))} →{" "}
                  {transaction.endDate
                    ? dateFormat(newZoneDate(transaction.endDate))
                    : "Ongoing"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">
                {moneyFormat(transaction.amount)}
              </div>
              <div className="text-xs text-muted-foreground">
                Interest: {moneyFormat(transaction.interestAmount || 0)}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Interest Rate:</span>
                <span className="font-medium text-foreground">1%</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Months Passed:</span>
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  {transaction.monthsPassed} months{" "}
                  {transaction.daysPassed} days
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Days in Cycle:</span>
                <span className="font-medium text-foreground">
                  {transaction.daysPassed} of {transaction.daysInMonth} days
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="font-medium text-foreground">
                  {dateFormat(newZoneDate(transaction.startDate))}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">End Date:</span>
                <span className="font-medium text-foreground">
                  {transaction.endDate
                    ? dateFormat(newZoneDate(transaction.endDate))
                    : "Ongoing"}
                </span>
              </div>
              {transaction.active && transaction.daysPassed > transaction.daysInMonth * 0.8 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Approaching due date</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

