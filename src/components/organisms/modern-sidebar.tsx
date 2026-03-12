"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderSync,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings,
  User,
  Users,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  setIsLoggedIn,
  toggleSideBarCollapse,
  useAppState,
} from "../providers/app-state-provider";
import { Button } from "../ui/button";
import { CustomLink } from "../ui/link";
import { ScrollArea } from "../ui/scroll-area";

import { useAuth } from "@/hooks/use-auth";
import { clubAge } from "@/lib/core/date";
import fetcher from "@/lib/core/fetcher";
import { cn } from "@/lib/ui/utils";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Members", href: "/dashboard/member" },
  { icon: Briefcase, label: "Vendors", href: "/dashboard/vendor" },
  { icon: FolderSync, label: "Loans", href: "/dashboard/loan" },
  { icon: Wallet, label: "Transactions", href: "/dashboard/transaction" },
  { icon: LineChart, label: "Analytics", href: "/dashboard/analytics" },
];

const secondaryNavItems: NavItem[] = [
  {
    icon: FileText,
    label: "Terms & Conditions",
    href: "/dashboard/terms-and-conditions",
  },
];

export function ModernSidebar() {
  const { state, dispatch } = useAppState();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { sideBarCollapsed, isLoggedIn } = state;
  const club = clubAge();
  const { user } = useAuth();
  const isGuest = user?.kind === "member" && user?.id === "guest";

  // Fetch profile data for members and admin-members
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      fetcher.get("/api/profile") as Promise<{
        account: {
          firstName: string | null;
          lastName: string | null;
          username: string;
        };
      }>,
    enabled:
      isLoggedIn && (user?.kind === "member" || user?.kind === "admin-member") && !isGuest,
  });

  // Get display name
  const getDisplayName = () => {
    if (user?.kind === "admin") {
      return "Super Admin";
    }
    if (profileData?.account) {
      const fullName = `${profileData.account.firstName || ""} ${
        profileData.account.lastName || ""
      }`.trim();
      return fullName || profileData.account.username;
    }
    return null;
  };

  const displayName = getDisplayName();

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
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen hidden lg:flex flex-col transition-all duration-300 ease-in-out",
        "bg-background/80 glass-surface",
        "shadow-lg",
        sideBarCollapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!sideBarCollapsed && (
          <Link
            href="/"
            className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <motion.div
              className="relative h-10 w-10 shrink-0"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/peacock.svg"
                alt="Peacock Club"
                fill
                className="object-contain"
              />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-brand font-bold text-foreground tracking-[0.15em] uppercase truncate">
                Peacock Club
              </h1>
              <p className="text-[10px] text-muted-foreground truncate">
                {club.inYear}
              </p>
            </div>
          </Link>
        )}
        {sideBarCollapsed && (
          <Link
            href="/"
            className="flex items-center justify-center w-full hover:opacity-80 transition-opacity cursor-pointer"
          >
            <motion.div
              className="relative h-8 w-8"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/peacock.svg"
                alt="Peacock Club"
                fill
                className="object-contain"
              />
            </motion.div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground transition-colors duration-300"
          onClick={() => dispatch(toggleSideBarCollapse())}
        >
          {sideBarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Gold separator */}
      <div className="gold-line mx-3" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <CustomLink
                key={item.href}
                href={item.href}
                variant="ghost"
                size="default"
                className={cn(
                  "w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  "text-muted-foreground hover:text-foreground hover:translate-x-0.5",
                  active &&
                    "text-primary bg-primary/5 border-l-2 border-primary font-medium hover:text-primary",
                  !active && "border-l-2 border-transparent",
                  sideBarCollapsed && "justify-center px-2"
                )}
                title={sideBarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn("h-5 w-5 shrink-0", active && "text-primary")}
                />
                {!sideBarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </CustomLink>
            );
          })}
        </nav>

        {/* Gold separator */}
        <div className="gold-line my-4" />

        <nav className="space-y-1">
          {secondaryNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <CustomLink
                key={item.href}
                href={item.href}
                variant="ghost"
                size="default"
                className={cn(
                  "w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  "text-muted-foreground hover:text-foreground hover:translate-x-0.5",
                  active &&
                    "text-primary bg-primary/5 border-l-2 border-primary font-medium hover:text-primary",
                  !active && "border-l-2 border-transparent",
                  sideBarCollapsed && "justify-center px-2"
                )}
                title={sideBarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn("h-5 w-5 shrink-0", active && "text-primary")}
                />
                {!sideBarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </CustomLink>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Gold separator */}
      <div className="gold-line mx-3" />

      {/* Footer Actions */}
      <div className="p-4 space-y-1">
        {isLoggedIn ? (
          <>
            {/* User Name Display */}
            {displayName && !sideBarCollapsed && (
              <div className="px-3 py-2 mb-2 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary/60 shrink-0" />
                  <span className="text-sm font-brand font-medium text-foreground truncate">
                    {displayName}
                  </span>
                </div>
              </div>
            )}
            {displayName && sideBarCollapsed && (
              <div className="flex items-center justify-center mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </div>
            )}
            {!isGuest && (
              <>
                <CustomLink
                  href="/dashboard/profile"
                  variant="ghost"
                  size="default"
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    "text-muted-foreground hover:text-foreground hover:translate-x-0.5",
                    sideBarCollapsed && "justify-center px-2",
                    isActive("/dashboard/profile") &&
                      "text-primary bg-primary/5 border-l-2 border-primary font-medium"
                  )}
                  title={sideBarCollapsed ? "Profile" : undefined}
                >
                  <User className="h-5 w-5 shrink-0" />
                  {!sideBarCollapsed && (
                    <span className="text-sm font-medium">Profile</span>
                  )}
                </CustomLink>
                <CustomLink
                  href="/dashboard/settings"
                  variant="ghost"
                  size="default"
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    "text-muted-foreground hover:text-foreground hover:translate-x-0.5",
                    sideBarCollapsed && "justify-center px-2",
                    isActive("/dashboard/settings") &&
                      "text-primary bg-primary/5 border-l-2 border-primary font-medium"
                  )}
                  title={sideBarCollapsed ? "Settings" : undefined}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  {!sideBarCollapsed && (
                    <span className="text-sm font-medium">Settings</span>
                  )}
                </CustomLink>
              </>
            )}
            <Button
              variant="ghost"
              size="default"
              className={cn(
                "w-full justify-start gap-3 px-3 py-2.5 rounded-lg",
                "text-muted-foreground hover:text-destructive transition-all duration-300",
                sideBarCollapsed && "justify-center px-2"
              )}
              title={sideBarCollapsed ? "Logout" : undefined}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!sideBarCollapsed && (
                <span className="text-sm font-medium">Logout</span>
              )}
            </Button>
          </>
        ) : (
          <CustomLink
            href="/"
            variant="ghost"
            size="default"
            className={cn(
              "w-full justify-start gap-3 px-3 py-2.5 rounded-lg",
              "text-muted-foreground hover:text-foreground transition-all duration-300",
              sideBarCollapsed && "justify-center px-2"
            )}
            title={sideBarCollapsed ? "Dashboard" : undefined}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {!sideBarCollapsed && (
              <span className="text-sm font-medium">Dashboard</span>
            )}
          </CustomLink>
        )}
      </div>
    </aside>
  );
}
