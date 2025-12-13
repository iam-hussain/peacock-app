"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "../ui/button";

import MenuItems from "./menu-items";

import { cn } from "@/lib/ui/utils";
import { RootState } from "@/store";
import { toggleSideBarCollapse } from "@/store/pageSlice";

function SideMenu() {
  const dispatch = useDispatch();
  const sideBarCollapsed = useSelector(
    (state: RootState) => state.page.sideBarCollapsed
  );

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
