"use client";

import { ReactNode } from "react";

import { Button } from "../ui/button";

import { cn } from "@/lib/ui/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  primaryAction?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  }>;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {(primaryAction || secondaryActions) && (
          <div className="flex flex-wrap items-center gap-2">
            {secondaryActions?.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="gap-2"
              >
                {action.icon}
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            ))}
            {primaryAction && (
              <Button
                variant="default"
                size="sm"
                onClick={primaryAction.onClick}
                className="gap-2"
              >
                {primaryAction.icon}
                {primaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
