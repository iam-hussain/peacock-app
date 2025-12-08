"use client";

import { Search } from "lucide-react";

import { Input } from "../ui/input";

import { cn } from "@/lib/utils";

interface SearchBarMobileProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBarMobile({
  value,
  onChange,
  placeholder = "Search items...",
  className,
}: SearchBarMobileProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl border border-border bg-background pl-11 pr-4 shadow-sm transition-all focus:border-border focus:shadow-md"
      />
    </div>
  );
}
