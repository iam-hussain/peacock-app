"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  toggleSideBarCollapse,
  useAppState,
} from "../providers/app-state-provider";
import { Button } from "../ui/button";

import MenuItems from "./menu-items";

import { cn } from "@/lib/ui/utils";

function SideMenu() {
  const { state, dispatch } = useAppState();
  const { sideBarCollapsed } = state;

  return (
    <div
      className={cn(
        "h-full min-h-svh hidden fixed lg:flex bg-background shadow-sm transition-all duration-300 p-6 pt-[90px]",
        sideBarCollapsed ? "w-[80px]" : "w-[300px]"
      )}
    >
      <div className="relative flex h-full w-full flex-col">
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-2 z-10 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted"
          onClick={() => dispatch(toggleSideBarCollapse())}
        >
          {sideBarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <MenuItems collapsed={sideBarCollapsed} />
      </div>
    </div>
  );
}

export default SideMenu;
