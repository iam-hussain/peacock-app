"use client";

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { ClickableAvatar } from "../atoms/clickable-avatar";
import { Badge } from "../ui/badge";

import { TransformedTransaction } from "@/app/api/transaction/route";
import { transactionTypeHumanMap } from "@/lib/config/config";
import { dateFormat, newZoneDate } from "@/lib/core/date";
import { moneyFormat } from "@/lib/ui/utils";

interface TransactionCardMobileProps {
  transaction: TransformedTransaction;
  onEdit?: (transaction: TransformedTransaction) => void;
  onDelete?: (transaction: TransformedTransaction) => void;
  onView?: (transaction: TransformedTransaction) => void;
}

const INFLOW_TYPES = [
  "PERIODIC_DEPOSIT",
  "OFFSET_DEPOSIT",
  "REJOIN",
  "VENDOR_RETURNS",
  "LOAN_REPAY",
  "LOAN_INTEREST",
];

const OUTFLOW_TYPES = ["WITHDRAW", "VENDOR_INVEST", "LOAN_TAKEN"];

export function TransactionCardMobile({
  transaction,
  onView,
}: TransactionCardMobileProps) {
  const transactionType =
    transaction.transactionType || (transaction as any).type;
  const primaryParty =
    transactionType === "LOAN_TAKEN" ? transaction.to : transaction.from;

  const { amountColor, amountPrefix, amountIcon } = useMemo(() => {
    const inflow = INFLOW_TYPES.includes(transactionType);
    const outflow = OUTFLOW_TYPES.includes(transactionType);
    return {
      amountColor: inflow
        ? "text-green-600 dark:text-green-500"
        : outflow
          ? "text-destructive"
          : "text-muted-foreground",
      amountPrefix: inflow ? "+" : outflow ? "−" : "",
      amountIcon: inflow ? ArrowDown : outflow ? ArrowUp : ArrowRight,
    };
  }, [transactionType]);

  const AmountIcon = amountIcon;

  return (
    <button
      type="button"
      onClick={() => onView?.(transaction)}
      className="w-full text-left rounded-xl border border-border/40 bg-card px-3 py-2.5 transition-colors active:bg-muted/40"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          {primaryParty.link ? (
            <ClickableAvatar
              src={primaryParty.avatar}
              alt={primaryParty.name}
              name={primaryParty.name}
              href={primaryParty.link}
              size="sm"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
              {primaryParty.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
        </div>

        {/* Name + type */}
        <div className="flex-1 min-w-0">
          {primaryParty.link ? (
            <Link
              href={primaryParty.link}
              className="block text-sm font-medium text-foreground truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {primaryParty.name}
            </Link>
          ) : (
            <p className="text-sm font-medium text-foreground truncate">
              {primaryParty.name}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge
              variant="secondary"
              className="text-[10px] font-medium rounded-md px-1.5 py-0 leading-relaxed h-4"
            >
              {transactionTypeHumanMap[transactionType] ||
                transactionTypeHumanMap.PERIODIC_DEPOSIT}
            </Badge>
          </div>
        </div>

        {/* Amount + date */}
        <div className="shrink-0 text-right">
          <div className={`flex items-center justify-end gap-1 ${amountColor}`}>
            {AmountIcon && <AmountIcon className="h-3 w-3" />}
            <span className="text-sm font-semibold tabular-nums">
              {amountPrefix}
              {moneyFormat(transaction.amount)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {dateFormat(newZoneDate(transaction.occurredAt))}
          </p>
        </div>
      </div>
    </button>
  );
}
