"use client";

import { format } from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";

import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { cn } from "@/lib/ui/utils";

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
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
    account?: {
      value: string;
      onChange: (value: string) => void;
      options: Array<{ label: string; value: string }>;
    };
    type?: {
      value: string;
      onChange: (value: string) => void;
      options: Array<{ label: string; value: string }>;
    };
  };
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
    onStartDateChange?: (date: Date | undefined) => void;
    onEndDateChange?: (date: Date | undefined) => void;
  };
  pageSize?: {
    value: number;
    onChange: (value: number) => void;
    options: number[];
  };
  onReset?: () => void;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search items...",
  filters,
  dateRange,
  pageSize,
  onReset,
  className,
}: FilterBarProps) {
  const hasActiveFilters =
    searchValue ||
    filters?.status?.value !== "all" ||
    filters?.balance?.value !== "all" ||
    filters?.account?.value !== "all" ||
    filters?.type?.value !== "all" ||
    dateRange?.startDate ||
    dateRange?.endDate;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 pl-9"
          />
        </div>

        {/* Account Filter */}
        {filters?.account && (
          <Select
            value={filters.account.value}
            onValueChange={filters.account.onChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              {filters.account.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Type Filter */}
        {filters?.type && (
          <Select
            value={filters.type.value}
            onValueChange={filters.type.onChange}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {filters.type.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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

        {/* Date From (Start Date) */}
        {dateRange?.onStartDateChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[140px] justify-start text-left font-normal",
                  !dateRange.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.startDate ? (
                  format(dateRange.startDate, "PPP")
                ) : (
                  <span>Start Date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.startDate}
                onSelect={dateRange.onStartDateChange}
                initialFocus={false}
                disabled={
                  dateRange.endDate
                    ? (date) => date > dateRange.endDate!
                    : undefined
                }
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Date To (End Date) */}
        {dateRange?.onEndDateChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[140px] justify-start text-left font-normal",
                  !dateRange.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.endDate ? (
                  format(dateRange.endDate, "PPP")
                ) : (
                  <span>End Date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.endDate}
                onSelect={dateRange.onEndDateChange}
                initialFocus={false}
                disabled={
                  dateRange.startDate
                    ? (date) => date < dateRange.startDate!
                    : undefined
                }
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Page Size */}
        {pageSize && (
          <Select
            value={pageSize.value.toString()}
            onValueChange={(value) => pageSize.onChange(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSize.options.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
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
