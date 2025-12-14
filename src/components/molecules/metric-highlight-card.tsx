"use client";

import { ReactElement } from "react";

import { Card, CardContent } from "../ui/card";

import { cn } from "@/lib/ui/utils";

interface MetricHighlightCardProps {
  title: string;
  value: string;
  icon: ReactElement;
  iconBgColor?: string;
  valueColor?: "default" | "green" | "red" | "blue";
  className?: string;
}

export function MetricHighlightCard({
  title,
  value,
  icon,
  iconBgColor = "#E3F2FD",
  valueColor = "default",
  className,
}: MetricHighlightCardProps) {
  const valueColorClasses = {
    default: "text-foreground",
    green: "text-green-600 dark:text-green-500",
    red: "text-destructive",
    blue: "text-blue-600 dark:text-blue-500",
  };

  return (
    <Card
      className={cn(
        "border-border/50 bg-card shadow-sm transition-all hover:shadow-md h-full",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            <p
              className={cn(
                "text-2xl font-bold tracking-tight md:text-3xl",
                valueColorClasses[valueColor]
              )}
            >
              {value}
            </p>
          </div>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full relative"
            style={{ backgroundColor: iconBgColor }}
          >
            <div className="absolute inset-0 rounded-full hidden dark:block bg-muted/60" />
            <div className="relative z-10 text-foreground/70">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
