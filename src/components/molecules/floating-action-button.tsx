"use client";

import { Plus, Wallet } from "lucide-react";

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
        "lg:hidden",
        "transition-all duration-200 hover:scale-105 active:scale-95",
        className
      )}
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label={label}
    >
      <div className="relative flex items-center justify-center">
        <Wallet className="h-5 w-5" />
        <Plus className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-background p-0.5" />
      </div>
      <span className="sr-only">{label}</span>
    </Button>
  );
}
