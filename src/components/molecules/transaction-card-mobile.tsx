"use client";

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import Link from "next/link";

import { ClickableAvatar } from "../atoms/clickable-avatar";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";

import { TransformedTransaction } from "@/app/api/transaction/route";
import { transactionTypeMap } from "@/lib/config/config";
import { dateFormat, newZoneDate } from "@/lib/core/date";
import { moneyFormat } from "@/lib/ui/utils";

interface TransactionCardMobileProps {
  transaction: TransformedTransaction;
  onClick?: () => void;
}

export function TransactionCardMobile({
  transaction,
  onClick,
}: TransactionCardMobileProps) {
  const isInflow = [
    "PERIODIC_DEPOSIT",
    "OFFSET_DEPOSIT",
    "REJOIN",
    "VENDOR_RETURNS",
    "LOAN_REPAY",
    "LOAN_INTEREST",
  ].includes(transaction.transactionType);

  const isOutflow = ["WITHDRAW", "VENDOR_INVEST", "LOAN_TAKEN"].includes(
    transaction.transactionType
  );

  const amountColor = isInflow
    ? "text-green-600 dark:text-green-500"
    : isOutflow
      ? "text-destructive"
      : "text-muted-foreground";

  const Icon = isInflow ? ArrowDown : isOutflow ? ArrowUp : ArrowRight;

  return (
    <Card
      className="border-border/50 bg-card shadow-sm transition-all hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Top Row: From + Amount */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {transaction.from.link ? (
              <ClickableAvatar
                src={transaction.from.avatar}
                alt={transaction.from.name}
                name={transaction.from.name}
                href={transaction.from.link}
                size="md"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                {transaction.from.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {transaction.from.link ? (
                <Link
                  href={transaction.from.link}
                  className="text-sm font-semibold text-foreground hover:underline block truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {transaction.from.name}
                </Link>
              ) : (
                <p className="text-sm font-semibold text-foreground truncate">
                  {transaction.from.name}
                </p>
              )}
              {transaction.from.sub && (
                <p className="text-xs text-muted-foreground truncate">
                  {transaction.from.sub}
                </p>
              )}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 ${amountColor} shrink-0`}>
            <Icon className="h-4 w-4" />
            <span className="text-base font-bold">
              {moneyFormat(transaction.amount)}
            </span>
          </div>
        </div>

        {/* Middle Row: Arrow + To */}
        <div className="flex items-center gap-2 mb-3 pl-[52px]">
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {transaction.to.link ? (
              <ClickableAvatar
                src={transaction.to.avatar}
                alt={transaction.to.name}
                name={transaction.to.name}
                href={transaction.to.link}
                size="sm"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                {transaction.to.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {transaction.to.link ? (
                <Link
                  href={transaction.to.link}
                  className="text-sm font-medium text-foreground hover:underline block truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {transaction.to.name}
                </Link>
              ) : (
                <p className="text-sm font-medium text-foreground truncate">
                  {transaction.to.name}
                </p>
              )}
              {transaction.to.sub && (
                <p className="text-xs text-muted-foreground truncate">
                  {transaction.to.sub}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator className="mb-3" />

        {/* Bottom Row: Type + Date */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            {transactionTypeMap[transaction.transactionType]}
          </p>
          <p className="text-xs text-muted-foreground">
            {dateFormat(newZoneDate(transaction.transactionAt))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
