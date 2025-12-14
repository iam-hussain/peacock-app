"use client";

import { Plus } from "lucide-react";

import { Button } from "../ui/button";

import { cn } from "@/lib/ui/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  label = "Add Transaction",
  className,
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "lg:hidden p-0",
        "transition-all duration-200 hover:scale-105 active:scale-95",
        className
      )}
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label={label}
    >
      <Plus className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
