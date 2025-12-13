"use client";

import { MoreHorizontal } from "lucide-react";

import { ClickableAvatar } from "../atoms/clickable-avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { dateFormat, newZoneDate } from "@/lib/core/date";
import { moneyFormat } from "@/lib/ui/utils";
import { TransformedMember } from "@/transformers/account";

interface MemberCardMobileProps {
  member: TransformedMember;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onViewTransactions?: () => void;
}

export function MemberCardMobile({
  member,
  onViewDetails,
  onEdit,
  onViewTransactions,
}: MemberCardMobileProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm px-4 py-5 space-y-4">
      {/* Member Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClickableAvatar
            src={member.avatar}
            alt={member.name}
            name={member.name}
            href={member.link}
            size="lg"
            className="rounded-lg"
          />
          <div className="flex flex-col">
            <p className="text-base font-semibold text-foreground">
              {member.name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  member.active ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {member.status}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            {onViewDetails && (
              <DropdownMenuItem onClick={onViewDetails}>
                View Details
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>Edit Member</DropdownMenuItem>
            )}
            {onViewTransactions && (
              <DropdownMenuItem onClick={onViewTransactions}>
                View Transactions
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Values Section - List Layout */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Managed
          </span>
          <span className="text-sm font-medium text-foreground">
            {moneyFormat(member.clubHeldAmount || 0)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Deposits
          </span>
          <span className="text-sm font-medium text-foreground">
            {moneyFormat(member.totalDepositAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Adjustments
          </span>
          <span className="text-sm font-medium text-foreground">
            {moneyFormat(member.totalOffsetAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Balance
          </span>
          <span
            className={`text-sm font-medium ${
              member.totalBalanceAmount > 0
                ? "text-destructive"
                : "text-green-600"
            }`}
          >
            {moneyFormat(member.totalBalanceAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Profit
          </span>
          <span className="text-sm font-medium text-green-600">
            {moneyFormat(member.totalReturnAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Value
          </span>
          <span className="text-sm font-semibold text-foreground">
            {moneyFormat(member.netValue)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Joined
          </span>
          <span className="text-xs font-medium text-foreground">
            {dateFormat(newZoneDate(member.startAt))}
          </span>
        </div>
      </div>
    </div>
  );
}
