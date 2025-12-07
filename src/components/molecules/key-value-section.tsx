"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

import { cn } from "@/lib/utils";

interface KeyValueRow {
  label: string;
  value: string | React.ReactNode;
  valueColor?: "default" | "green" | "red" | "muted";
  align?: "left" | "right";
}

interface KeyValueSectionProps {
  title?: string;
  rows: KeyValueRow[];
  className?: string;
}

const valueColorClasses = {
  default: "text-foreground",
  green: "text-green-600 dark:text-green-500",
  red: "text-destructive",
  muted: "text-muted-foreground",
};

export function KeyValueSection({
  title,
  rows,
  className,
}: KeyValueSectionProps) {
  return (
    <Card className={cn("border-border/50 bg-card shadow-sm", className)}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(title ? "pt-0" : "pt-6")}>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={index}>
              <div
                className={cn(
                  "flex items-center justify-between gap-4",
                  row.align === "right" && "flex-row-reverse"
                )}
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {row.label}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    valueColorClasses[row.valueColor || "default"]
                  )}
                >
                  {row.value}
                </span>
              </div>
              {index < rows.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
