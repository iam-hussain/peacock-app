"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, LogOut, Menu, Search, User, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { GlobalSearch } from "../molecules/global-search";
import SoundToggle from "../molecules/sound-toggle";
import { ThemeModeToggle } from "../molecules/theme-mode-toggle";
import {
  openSideBar,
  setIsLoggedIn,
  useAppState,
} from "../providers/app-state-provider";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { useAuth } from "@/hooks/use-auth";
import fetcher from "@/lib/core/fetcher";
import { cn } from "@/lib/ui/utils";

const getPageTitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/dashboard/member")) return "Members";
  if (pathname.startsWith("/dashboard/vendor")) return "Vendors";
  if (pathname.startsWith("/dashboard/loan")) return "Loans";
  if (pathname.startsWith("/dashboard/transaction")) return "Transactions";
  if (pathname.startsWith("/dashboard/terms-and-conditions"))
    return "Terms & Conditions";
  if (pathname.startsWith("/dashboard/analytics")) return "Analytics";
  if (pathname.startsWith("/dashboard/profile")) return "Profile";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  return "Dashboard";
};

export function ModernTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, dispatch } = useAppState();
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const { sideBarOpen, sideBarCollapsed } = state;
  const { user } = useAuth();
  const isGuest = user?.kind === "member" && user?.id === "guest";

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
      transition={{ type: "spring", stiffness: 80, damping: 18, duration: 0.8 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-30 h-14",
        "bg-background/60 glass-surface",
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
            className="lg:hidden h-9 w-9 border border-primary/20 text-primary hover:bg-primary/5"
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
            <span className="text-sm text-muted-foreground font-brand tracking-wide">
              Peacock Club
            </span>
            <span className="text-primary/40">/</span>
            <h1 className="text-sm font-semibold text-foreground truncate">
              {pageTitle}
            </h1>
          </div>

          {/* Mobile App Name */}
          <div className="md:hidden">
            <h1 className="text-sm font-brand font-bold text-foreground tracking-wide">
              Peacock Club
            </h1>
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
          className="lg:hidden h-9 w-9 text-primary/70 hover:text-primary"
          onClick={() => setSearchOpen(!searchOpen)}
          data-search-button
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <SoundToggle />
          {/* Theme Toggle */}
          <ThemeModeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 px-2 hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all duration-300"
              >
                <Avatar className="h-7 w-7 ring-1 ring-primary/20">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 hidden sm:block text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 glass-surface bg-background/95"
            >
              {!isGuest && (
                <>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/profile")}
                    className="cursor-pointer focus:bg-primary/5 focus:text-primary"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/settings")}
                    className="cursor-pointer focus:bg-primary/5 focus:text-primary"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/10" />
                </>
              )}
              <DropdownMenuItem
                className="text-muted-foreground focus:text-destructive cursor-pointer transition-colors duration-300"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Gold line at bottom */}
      <div className="gold-line" />

      {/* Mobile Search Bar */}
      {searchOpen && (
        <motion.div
          ref={searchBarRef}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden px-4 py-3 bg-background/95 glass-surface"
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
