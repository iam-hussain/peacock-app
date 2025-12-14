"use client";

import { ArrowDown, ArrowRight, ArrowUp, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { ClickableAvatar } from "../atoms/clickable-avatar";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { TransformedTransaction } from "@/app/api/transaction/route";
import { transactionTypeHumanMap } from "@/lib/config/config";
import { dateFormat, newZoneDate } from "@/lib/core/date";
import { moneyFormat } from "@/lib/ui/utils";

interface TransactionCardMobileProps {
  transaction: TransformedTransaction;
  onEdit?: (transaction: TransformedTransaction) => void;
  onDelete?: (transaction: TransformedTransaction) => void;
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
  onEdit,
  onDelete,
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
        ? "text-success-foreground"
        : outflow
          ? "text-destructive"
          : "text-muted-foreground",
      amountPrefix: inflow ? "+" : outflow ? "−" : "",
      amountIcon: inflow ? ArrowDown : outflow ? ArrowUp : ArrowRight,
    };
  }, [transactionType]);

  const handleEdit = () => {
    onEdit?.(transaction);
  };

  const AmountIcon = amountIcon;

  return (
    <Card className="rounded-2xl border border-border/50 bg-card shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Row 1: Avatar/name/club on left, direction+amount+menu on right */}
        <div className="flex items-start gap-4">
          <div className="flex flex-1 items-start gap-3 min-w-0">
            {primaryParty.link ? (
              <ClickableAvatar
                src={primaryParty.avatar}
                alt={primaryParty.name}
                name={primaryParty.name}
                href={primaryParty.link}
                size="md"
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                {primaryParty.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
            <div className="min-w-0 space-y-1">
              {primaryParty.link ? (
                <Link
                  href={primaryParty.link}
                  className="block text-sm font-semibold text-foreground truncate"
                  onClick={(event) => event.stopPropagation()}
                >
                  {primaryParty.name}
                </Link>
              ) : (
                <p className="text-sm font-semibold text-foreground truncate">
                  {primaryParty.name}
                </p>
              )}
              <p className="text-xs text-muted-foreground truncate">
                {primaryParty.sub || "Peacock Club"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 shrink-0">
            <div className={`flex items-center gap-1 ${amountColor}`}>
              {AmountIcon && <AmountIcon className="h-4 w-4" />}
              <span className="text-lg font-semibold tabular-nums">
                {amountPrefix}
                {moneyFormat(transaction.amount)}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground hover:bg-muted/60"
                  aria-label="Transaction actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete?.(transaction)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2: Badge + note (left), Date (right) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Badge
              variant="secondary"
              className="text-[11px] font-medium rounded-full px-3 py-1 leading-tight"
            >
              {transactionTypeHumanMap[transactionType] ||
                transactionTypeHumanMap.PERIODIC_DEPOSIT}
            </Badge>
            <span className="text-xs text-muted-foreground truncate">
              {(transaction as any).note || (transaction as any).description}
            </span>
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            {dateFormat(newZoneDate(transaction.occurredAt))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
