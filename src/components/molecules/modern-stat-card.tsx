"use client";

import { ReactElement } from "react";

import { Card, CardContent } from "../ui/card";

import { cn } from "@/lib/utils";

interface ModernStatCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: ReactElement;
  iconBgColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  isHighlighted?: boolean;
}

export function ModernStatCard({
  title,
  value,
  icon,
  iconBgColor = "bg-primary/10",
  trend,
  className,
  isHighlighted = false,
}: ModernStatCardProps) {
  // Check if iconBgColor is a hex color or a Tailwind class
  const isHexColor =
    typeof iconBgColor === "string" && iconBgColor.startsWith("#");
  const iconBgStyle = isHexColor ? { backgroundColor: iconBgColor } : {};
  const iconBgClass = isHexColor ? "" : iconBgColor;

  return (
    <Card
      className={cn(
        "h-full flex flex-col rounded-lg border border-border/50 bg-card shadow-sm transition-all hover:shadow-md",
        isHighlighted && "ring-2 ring-primary/20 shadow-md border-primary/30",
        className
      )}
    >
      <CardContent
        className={cn("flex flex-1 flex-col p-4", isHighlighted && "p-5")}
      >
        <div className="flex flex-1 items-center justify-between gap-4">
          {/* Left: Label */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
          </div>
          {/* Center: Value */}
          <div className="flex-1 text-center">
            {typeof value === "string" || typeof value === "number" ? (
              <p
                className={cn(
                  "font-bold tracking-tight text-foreground",
                  isHighlighted ? "text-2xl" : "text-xl"
                )}
              >
                {value}
              </p>
            ) : (
              <div
                className={cn(
                  "font-bold tracking-tight text-foreground",
                  isHighlighted ? "text-2xl" : "text-xl"
                )}
              >
                {value}
              </div>
            )}
            {trend && (
              <p
                className={cn(
                  "mt-0.5 text-[10px] font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </p>
            )}
          </div>
          {/* Right: Icon */}
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full relative",
              isHighlighted ? "h-12 w-12" : "h-10 w-10",
              !isHexColor && iconBgClass
            )}
          >
            {/* Light mode background (hex color) */}
            {isHexColor && (
              <div
                className="absolute inset-0 rounded-full dark:hidden"
                style={iconBgStyle}
              />
            )}
            {/* Dark mode background */}
            {isHexColor && (
              <div className="absolute inset-0 rounded-full hidden dark:block bg-muted/60" />
            )}
            {/* Icon content */}
            <div
              className={cn(
                "relative z-10 text-foreground/70",
                isHighlighted ? "text-xl" : "text-lg"
              )}
            >
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
