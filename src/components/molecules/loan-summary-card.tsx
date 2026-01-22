"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";

import { moneyFormat } from "@/lib/ui/utils";

interface LoanSummaryCardProps {
  totalLoanTaken: number;
  totalLoanRepaid: number;
  currentLoanAmount: number;
  totalInterestGenerated: number;
  interestPaid: number;
  interestBalance: number;
}

export function LoanSummaryCard({
  totalLoanTaken,
  totalLoanRepaid,
  currentLoanAmount,
  totalInterestGenerated,
  interestPaid,
  interestBalance,
}: LoanSummaryCardProps) {
  const loanProgress =
    totalLoanTaken > 0 ? (totalLoanRepaid / totalLoanTaken) * 100 : 0;
  const interestProgress =
    totalInterestGenerated > 0
      ? (interestPaid / totalInterestGenerated) * 100
      : 0;

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Loan Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loan Amounts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total Loan Taken
            </span>
            <span className="text-sm font-semibold text-foreground">
              {moneyFormat(totalLoanTaken)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total Loan Repaid
            </span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-500">
              {moneyFormat(totalLoanRepaid)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Current Loan Amount
            </span>
            <span className="text-sm font-semibold text-foreground">
              {moneyFormat(currentLoanAmount)}
            </span>
          </div>
        </div>

        {/* Loan Progress */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Repayment Progress</span>
            <span className="font-medium text-foreground">
              {loanProgress.toFixed(1)}%
            </span>
          </div>
          <Progress value={loanProgress} className="h-2" />
        </div>

        {/* Interest Details */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total Interest Generated
            </span>
            <span className="text-sm font-semibold text-foreground">
              {moneyFormat(totalInterestGenerated)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Interest Paid
            </span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-500">
              {moneyFormat(interestPaid) || 0}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Interest Balance (Due)
            </span>
            <span
              className={`text-sm font-semibold ${
                interestBalance > 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {moneyFormat(interestBalance)}
            </span>
          </div>
        </div>

        {/* Interest Progress */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Interest Payment Progress
            </span>
            <span className="font-medium text-foreground">
              {interestProgress.toFixed(1)}%
            </span>
          </div>
          <Progress value={interestProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
