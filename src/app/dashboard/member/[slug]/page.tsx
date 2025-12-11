"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, Landmark, Percent, Wallet } from "lucide-react";
import { useMemo } from "react";

import { KeyValueSection } from "@/components/molecules/key-value-section";
import { LoanSummaryCard } from "@/components/molecules/loan-summary-card";
import { LoanTransactionCard } from "@/components/molecules/loan-transaction-card";
import { MemberHeaderCard } from "@/components/molecules/member-header-card";
import { MetricHighlightCard } from "@/components/molecules/metric-highlight-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchMemberByUsername } from "@/lib/query-options";
import { moneyFormat } from "@/lib/utils";

export default function MemberPage({ params }: { params: { slug: string } }) {
  const username = params.slug; // URL param is still 'slug' for backward compatibility
  const { data, isLoading, isError } = useQuery(
    fetchMemberByUsername(username)
  );

  const member = data?.member;

  const monthsPassedDisplay = useMemo(() => {
    if (!member?.monthsPassedString) return null;
    return member.monthsPassedString;
  }, [member?.monthsPassedString]);

  if (isLoading || !member) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-7xl mx-auto p-8">
        <Card className="border-destructive">
          <CardContent className="p-8 text-center text-destructive">
            Unexpected error on fetching the data
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6 pb-24 lg:pb-6">
      {/* Member Header */}
      <MemberHeaderCard member={member} />

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricHighlightCard
          title="Deposit Balance"
          value={moneyFormat(member.periodicDepositBalance || 0)}
          icon={<Wallet className="h-6 w-6" />}
          iconBgColor="#E8F5E9"
          valueColor={
            (member.periodicDepositBalance || 0) > 0 ? "green" : "default"
          }
        />
        <MetricHighlightCard
          title="Loan Amount Taken"
          value={moneyFormat(member.totalLoanBalance || 0)}
          icon={<Landmark className="h-6 w-6" />}
          iconBgColor="#E3F2FD"
          valueColor="blue"
        />
        <MetricHighlightCard
          title="Interest Balance (Due)"
          value={moneyFormat(member.totalInterestBalance || 0)}
          icon={<Percent className="h-6 w-6" />}
          iconBgColor="#FBE9E7"
          valueColor={member.totalInterestBalance > 0 ? "red" : "default"}
        />
      </div>

      {/* Detail Area with Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground min-w-full">
            <TabsTrigger
              value="overview"
              className="whitespace-nowrap px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="deposits"
              className="whitespace-nowrap px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Deposits
            </TabsTrigger>
            <TabsTrigger
              value="offsets"
              className="whitespace-nowrap px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Offsets
            </TabsTrigger>
            <TabsTrigger
              value="loan-summary"
              className="whitespace-nowrap px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Loan Summary
            </TabsTrigger>
            <TabsTrigger
              value="loan-transactions"
              className="whitespace-nowrap px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Loan Transactions
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Contribution & Deposits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {monthsPassedDisplay && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Months Passed
                      </span>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {monthsPassedDisplay}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Deposits
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {moneyFormat(member.totalDepositAmount || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Returns (Profit Earned)
                  </span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-500">
                    {moneyFormat(member.totalReturnAmount || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Offsets & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Late Join Offset
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {moneyFormat(member.joiningOffset || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Delay Paying Offset
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {moneyFormat(member.delayOffset || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Offset
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {moneyFormat(member.totalOffsetAmount || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Member Status
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      member.active
                        ? "text-green-600 dark:text-green-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
                {member.totalInterestBalance > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
                      <AlertTriangle className="h-4 w-4" />
                      <span>High outstanding interest</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deposits Tab */}
        <TabsContent value="deposits" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <KeyValueSection
              rows={[
                {
                  label: "Periodic Deposit",
                  value: moneyFormat(member.periodicDepositAmount || 0),
                  align: "right",
                },
                {
                  label: "Offset Deposit",
                  value: moneyFormat(member.offsetDepositAmount || 0),
                  align: "right",
                },
                {
                  label: "Total Deposit",
                  value: moneyFormat(member.totalDepositAmount || 0),
                  align: "right",
                },
                {
                  label: "Deposit Balance",
                  value: moneyFormat(member.periodicDepositBalance || 0),
                  valueColor:
                    (member.periodicDepositBalance || 0) > 0
                      ? "green"
                      : "default",
                  align: "right",
                },
              ]}
            />
            <KeyValueSection
              rows={[
                {
                  label: "Months Passed",
                  value: monthsPassedDisplay || "-",
                  valueColor: "muted",
                  align: "right",
                },
                {
                  label: "Returns / Profit Earned",
                  value: moneyFormat(member.totalReturnAmount || 0),
                  valueColor: "green",
                  align: "right",
                },
              ]}
            />
          </div>
        </TabsContent>

        {/* Offsets Tab */}
        <TabsContent value="offsets" className="space-y-4 md:space-y-6">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Member Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TooltipProvider>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Late Join Offset Amount
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Additional amount charged when joining mid-cycle</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-500">
                    {moneyFormat(member.joiningOffset || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Delay Paying Offset Amount
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Penalty for late payments or delayed deposits</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-500">
                    {moneyFormat(member.delayOffset || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Offset
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {moneyFormat(member.totalOffsetAmount || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Offset Balance
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {moneyFormat(member.totalOffsetBalanceAmount || 0)}
                  </span>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loan Summary Tab */}
        <TabsContent value="loan-summary" className="space-y-4 md:space-y-6">
          <LoanSummaryCard
            totalLoanTaken={member.totalLoanTaken || 0}
            totalLoanRepaid={member.totalLoanRepay || 0}
            currentLoanAmount={member.totalLoanBalance || 0}
            totalInterestGenerated={member.totalInterestAmount || 0}
            interestPaid={member.totalInterestPaid || 0}
            interestBalance={member.totalInterestBalance || 0}
          />
        </TabsContent>

        {/* Loan Transactions Tab */}
        <TabsContent value="loan-transactions" className="space-y-4">
          {member.loanHistory &&
          Array.isArray(member.loanHistory) &&
          member.loanHistory.length > 0 ? (
            <div className="space-y-4">
              {member.loanHistory
                .sort((a, b) => {
                  // Sort by startDate descending (newest first)
                  const dateA =
                    typeof a.startDate === "number"
                      ? a.startDate
                      : new Date(a.startDate).getTime();
                  const dateB =
                    typeof b.startDate === "number"
                      ? b.startDate
                      : new Date(b.startDate).getTime();
                  return dateB - dateA;
                })
                .map((transaction, index) => (
                  <LoanTransactionCard
                    key={`${transaction.startDate}-${index}`}
                    transaction={transaction}
                    index={index + 1}
                    totalCount={member.loanHistory.length}
                  />
                ))}
            </div>
          ) : (
            <Card className="border-border/50 bg-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                No loan transactions found
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
