"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import MemberWatermark from "@/components/molecules/member-watermark";
import { MobileBottomNav } from "@/components/organisms/mobile-bottom-nav";
import { ModernSidebar } from "@/components/organisms/modern-sidebar";
import { ModernSidebarMobile } from "@/components/organisms/modern-sidebar-mobile";
import { ModernTopBar } from "@/components/organisms/modern-top-bar";
import {
  setIsLoggedIn,
  useAppState,
} from "@/components/providers/app-state-provider";
import { fetchAuthStatus } from "@/lib/query-options";
import { cn } from "@/lib/ui/utils";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { state, dispatch } = useAppState();
  const { data, isLoading, isError } = useQuery(fetchAuthStatus());
  const { sideBarCollapsed } = state;

  useEffect(() => {
    if (data) {
      dispatch(setIsLoggedIn(data.isLoggedIn));

      // Redirect to home if not logged in
      if (!data.isLoggedIn) {
        router.push("/");
      }
    }

    if (isError || (!isLoading && !data?.isLoggedIn)) {
      dispatch(setIsLoggedIn(false));
      router.push("/");
    }
  }, [data, isError, isLoading, dispatch, router]);

  // Show loading state or nothing while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render dashboard if not logged in (will redirect)
  if (!data?.isLoggedIn) {
    return null;
  }

  return (
    <div className="main-wrapper">
      <main className={"page-main bg-paper"}>
        <MemberWatermark />
        <ModernTopBar />
        <ModernSidebar />
        <div
          className={cn(
            "h-full min-h-svh w-full transition-all duration-300 max-w-screen-3xl m-auto mt-0 pt-[56px]",
            sideBarCollapsed ? "lg:pl-[80px]" : "lg:pl-[260px]"
          )}
          id="dashboard-content"
        >
          <div className="w-full flex h-full p-2 sm:p-4 md:p-6 pb-20 lg:pb-6">
            {children}
          </div>
        </div>
      </main>
      <ModernSidebarMobile />
      <MobileBottomNav />
    </div>
  );
}
