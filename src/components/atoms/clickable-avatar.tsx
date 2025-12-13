"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

import { cn } from "@/lib/ui/utils";

interface ClickableAvatarProps {
  src?: string;
  alt: string;
  name: string;
  href: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-20 w-20",
};

const fallbackSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

export function ClickableAvatar({
  src,
  alt,
  name,
  href,
  size = "md",
  className,
}: ClickableAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isRounded =
    className?.includes("rounded-lg") || className?.includes("rounded-xl");
  const roundedClass = isRounded ? "" : "rounded-full";

  return (
    <Link
      href={href}
      className={cn(
        "inline-block transition-all hover:scale-105 hover:shadow-md cursor-pointer",
        roundedClass,
        className
      )}
    >
      <Avatar
        className={cn(
          sizeClasses[size],
          "ring-2 ring-border/50 transition-all hover:ring-primary/30",
          isRounded ? "rounded-lg" : "rounded-full"
        )}
      >
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback
          className={cn(
            "bg-primary/10 text-primary font-semibold",
            fallbackSizeClasses[size],
            isRounded ? "rounded-lg" : "rounded-full"
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
