"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, LogOut, Menu, Search, User, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import { GlobalSearch } from "../molecules/global-search";
import { ThemeModeToggle } from "../molecules/theme-mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import fetcher from "@/lib/core/fetcher";
import { cn } from "@/lib/ui/utils";
import { RootState } from "@/store";
import { openSideBar, setIsLoggedIn } from "@/store/pageSlice";

const getPageTitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/dashboard/member")) return "Members";
  if (pathname.startsWith("/dashboard/vendor")) return "Vendors";
  if (pathname.startsWith("/dashboard/loan")) return "Loans";
  if (pathname.startsWith("/dashboard/transaction")) return "Transactions";
  if (pathname.startsWith("/dashboard/terms-and-conditions"))
    return "Terms & Conditions";
  return "Dashboard";
};

export function ModernTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const sideBarOpen = useSelector((state: RootState) => state.page.sideBarOpen);
  const sideBarCollapsed = useSelector(
    (state: RootState) => state.page.sideBarCollapsed
  );

  // Close mobile search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Don't close if clicking on the search button or inside the search bar
      if (
        target.closest("[data-search-button]") ||
        (searchBarRef.current && searchBarRef.current.contains(target))
      ) {
        return;
      }

      // Close if clicking outside
      if (searchOpen) {
        setSearchOpen(false);
      }
    };

    if (searchOpen) {
      // Use a small delay to avoid closing immediately when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [searchOpen]);

  const logoutMutation = useMutation({
    mutationFn: () => fetcher.post("/api/auth/logout"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authentication"] });
      dispatch(setIsLoggedIn(false));
      toast.success("Logged out successfully!");
      router.push("/");
    },
    onError: (error: any) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
      // Still redirect to home even on error
      router.push("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <motion.header
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-30 h-14",
        "bg-background/80 backdrop-blur-md border-b border-border/50",
        "shadow-sm",
        "transition-all duration-300",
        sideBarCollapsed ? "lg:pl-[80px]" : "lg:pl-[260px]"
      )}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={() => dispatch(openSideBar())}
          >
            {sideBarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Page Title & Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span className="text-sm text-muted-foreground">Peacock Club</span>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-sm font-semibold text-foreground truncate">
              {pageTitle}
            </h1>
          </div>

          {/* Mobile App Name */}
          <div className="md:hidden">
            <h1 className="text-sm font-bold text-foreground">Peacock Club</h1>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
          <GlobalSearch />
        </div>

        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={() => setSearchOpen(!searchOpen)}
          data-search-button
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeModeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 px-2 hover:bg-accent"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/profile")}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {searchOpen && (
        <motion.div
          ref={searchBarRef}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden border-t border-border/50 px-4 py-3 bg-background"
        >
          <GlobalSearch
            onResultClick={() => setSearchOpen(false)}
            isMobile={true}
          />
        </motion.div>
      )}
    </motion.header>
  );
}
