"use client";

import { Download, FileText, MoreVertical, Receipt } from "lucide-react";
import Link from "next/link";

import { ClickableAvatar } from "@/components/atoms/clickable-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dateFormat, newZoneDate } from "@/lib/date";
import { moneyFormat } from "@/lib/utils";

interface MemberHeaderCardProps {
  member: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
    startAt: number;
    active: boolean;
    status: string;
    clubHeldAmount?: number;
    loanHistory?: Array<{ active?: boolean }>;
  };
}

export function MemberHeaderCard({ member }: MemberHeaderCardProps) {
  const activeLoansCount =
    member.loanHistory?.filter((loan) => loan.active).length || 0;

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
          {/* Left: Avatar + Info */}
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-6">
            <ClickableAvatar
              src={member.avatar}
              alt={member.name}
              name={member.name}
              href={`/dashboard/member/${member.username}`}
              size="xl"
            />
            <div className="flex flex-col items-center gap-2 md:items-start">
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {member.name}
              </h1>
              <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-4">
                <p className="text-sm text-muted-foreground">
                  Joined {dateFormat(newZoneDate(member.startAt))}
                </p>
                <Badge
                  variant={member.active ? "default" : "secondary"}
                  className={
                    member.active
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                      : ""
                  }
                >
                  {member.status}
                  {member.active && activeLoansCount > 0 && (
                    <span className="ml-1.5">({activeLoansCount})</span>
                  )}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Managing {moneyFormat(member?.clubHeldAmount || 0)} of club
                funds
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/transaction?member=${member.username}`}>
                <Receipt className="mr-2 h-4 w-4" />
                View Transactions
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/member/${member.username}?export=pdf`}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/transaction?member=${member.username}`}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    View All Transactions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/loans?member=${member.username}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    View All Loans
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
