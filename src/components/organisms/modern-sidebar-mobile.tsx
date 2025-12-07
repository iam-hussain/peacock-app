"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  FileText,
  FolderSync,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import { Button } from "../ui/button";
import { CustomLink } from "../ui/link";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

import { clubAge } from "@/lib/date";
import fetcher from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { openSideBar, setIsLoggedIn } from "@/store/pageSlice";

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
];

const secondaryNavItems: NavItem[] = [
  {
    icon: FileText,
    label: "Terms & Conditions",
    href: "/dashboard/terms-and-conditions",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/dashboard/settings",
  },
];

export function ModernSidebarMobile() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const sideBarOpen = useSelector((state: RootState) => state.page.sideBarOpen);
  const isLoggedIn = useSelector((state: RootState) => state.page.isLoggedIn);
  const club = clubAge();

  const logoutMutation = useMutation({
    mutationFn: () => fetcher.post("/api/auth/logout"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authentication"] });
      dispatch(setIsLoggedIn(false));
      toast.success("Logged out successfully!");
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
    handleClose();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleClose = () => {
    dispatch(openSideBar());
  };

  return (
    <AnimatePresence>
      {sideBarOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={handleClose}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-screen w-[280px] lg:hidden flex flex-col bg-background shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0">
                  <Image
                    src="/peacock.svg"
                    alt="Peacock Club"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-foreground">
                    Peacock Club
                  </h1>
                  <p className="text-[10px] text-muted-foreground">
                    {club.inYear}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

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
                        "w-full justify-start gap-3 px-3 py-3 rounded-lg transition-all",
                        "hover:bg-accent hover:text-accent-foreground",
                        "active:scale-[0.98]",
                        active &&
                          "bg-primary/10 text-primary border-l-2 border-primary font-medium"
                      )}
                      onClick={handleClose}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          active && "text-primary"
                        )}
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </CustomLink>
                  );
                })}
              </nav>

              <Separator className="my-4" />

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
                        "w-full justify-start gap-3 px-3 py-3 rounded-lg transition-all",
                        "hover:bg-accent hover:text-accent-foreground",
                        "active:scale-[0.98]",
                        active &&
                          "bg-primary/10 text-primary border-l-2 border-primary font-medium"
                      )}
                      onClick={handleClose}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          active && "text-primary"
                        )}
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </CustomLink>
                  );
                })}
              </nav>
            </ScrollArea>

            {/* Footer Actions */}
            {isLoggedIn && (
              <div className="p-4 border-t border-border/50 space-y-1">
                <CustomLink
                  href="/dashboard/profile"
                  variant="ghost"
                  size="default"
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground",
                    isActive("/dashboard/profile") &&
                      "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={handleClose}
                >
                  <User className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">Profile</span>
                </CustomLink>
                <CustomLink
                  href="/dashboard/settings"
                  variant="ghost"
                  size="default"
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground",
                    isActive("/dashboard/settings") &&
                      "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={handleClose}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">Settings</span>
                </CustomLink>
                <Button
                  variant="ghost"
                  size="default"
                  className="w-full justify-start gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">Logout</span>
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
