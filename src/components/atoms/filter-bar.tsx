"use client";

import { Search, X } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { cn } from "@/lib/utils";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: {
    status?: {
      value: string;
      onChange: (value: string) => void;
      options: Array<{ label: string; value: string }>;
    };
    balance?: {
      value: string;
      onChange: (value: string) => void;
      options: Array<{ label: string; value: string }>;
    };
  };
  onReset?: () => void;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  filters,
  onReset,
  className,
}: FilterBarProps) {
  const hasActiveFilters =
    searchValue ||
    filters?.status?.value !== "all" ||
    filters?.balance?.value !== "all";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Filter members..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        {filters?.status && (
          <Select
            value={filters.status.value}
            onValueChange={filters.status.onChange}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {filters.status.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Balance Filter */}
        {filters?.balance && (
          <Select
            value={filters.balance.value}
            onValueChange={filters.balance.onChange}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Balance" />
            </SelectTrigger>
            <SelectContent>
              {filters.balance.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Reset Button */}
        {hasActiveFilters && onReset && (
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
