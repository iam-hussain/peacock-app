"use client";

import {
  FolderSync,
  LayoutDashboard,
  MoreHorizontal,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { useDispatch } from "react-redux";

import { Button } from "../ui/button";
import { CustomLink } from "../ui/link";

import { cn } from "@/lib/ui/utils";
import { openSideBar } from "@/store/pageSlice";

interface BottomNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  isMore?: boolean;
}

const bottomNavItems: BottomNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Members", href: "/dashboard/member" },
  { icon: FolderSync, label: "Loans", href: "/dashboard/loan" },
  { icon: MoreHorizontal, label: "More", href: "#", isMore: true },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const dispatch = useDispatch();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "#") return false;
    return pathname.startsWith(href);
  };

  const handleMoreClick = () => {
    dispatch(openSideBar());
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 lg:hidden",
        "bg-background border-t border-border",
        "shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
      )}
      style={{
        paddingBottom: `max(0.5rem, env(safe-area-inset-bottom))`,
      }}
    >
      <div className="flex items-center justify-between h-16 px-2 max-w-md mx-auto">
        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          if (item.isMore) {
            return (
              <Button
                key="more"
                variant="ghost"
                size="icon"
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-full w-full",
                  "transition-colors",
                  "text-muted-foreground hover:text-foreground"
                )}
                onClick={handleMoreClick}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </Button>
            );
          }
          return (
            <CustomLink
              key={item.href}
              href={item.href}
              variant="ghost"
              size="icon"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 h-full w-full",
                "transition-colors relative",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-all",
                  active && "text-primary scale-110"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-all",
                  active && "font-semibold"
                )}
              >
                {item.label}
              </span>
              {active && (
                <>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-primary" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-primary" />
                </>
              )}
            </CustomLink>
          );
        })}
      </div>
    </nav>
  );
}
