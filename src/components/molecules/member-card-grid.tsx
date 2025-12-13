"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

import { cn } from "@/lib/ui/utils";
import { moneyFormat } from "@/lib/ui/utils";
import { TransformedMember } from "@/transformers/account";

interface MemberCardGridProps {
  member: TransformedMember;
  onClick?: () => void;
}

export function MemberCardGrid({ member, onClick }: MemberCardGridProps) {
  const fundsManaged = member.clubHeldAmount || 0;

  return (
    <Link
      href={member.link}
      onClick={onClick}
      className="group flex flex-col items-center rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:border-border hover:shadow-md active:scale-[0.98]"
    >
      {/* Avatar */}
      <Avatar className="mb-3 h-16 w-16 rounded-xl ring-2 ring-border/50 transition-all group-hover:ring-primary/20">
        <AvatarImage src={member.avatar} alt={member.name} />
        <AvatarFallback className="rounded-xl bg-primary/10 text-base font-semibold text-primary">
          {member.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <p className="mb-1.5 line-clamp-1 text-center text-sm font-semibold text-foreground">
        {member.name}
      </p>

      {/* Status */}
      <div className="mb-2 flex items-center gap-1.5">
        <div
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            member.active ? "bg-green-500" : "bg-muted-foreground"
          )}
        />
        <span className="text-xs text-muted-foreground">{member.status}</span>
      </div>

      {/* Funds Managed */}
      <p className="text-center text-xs font-medium text-muted-foreground">
        {moneyFormat(fundsManaged)} managed
      </p>
    </Link>
  );
}
