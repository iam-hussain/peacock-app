"use client";

import { cn } from "@/lib/ui/utils";

interface FilterChip {
  label: string;
  value: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterChips({
  chips,
  selectedValue,
  onChange,
  className,
}: FilterChipsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => {
        const isSelected = chip.value === selectedValue;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onChange(chip.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
              "border border-border/50 shadow-sm",
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-foreground hover:bg-muted/50 hover:border-border"
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
