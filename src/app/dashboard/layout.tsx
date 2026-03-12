"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import MemberWatermark from "@/components/molecules/member-watermark";
import WelcomeMonogram from "@/components/molecules/welcome-monogram";
import { MobileBottomNav } from "@/components/organisms/mobile-bottom-nav";
import { ModernSidebar } from "@/components/organisms/modern-sidebar";
import { ModernSidebarMobile } from "@/components/organisms/modern-sidebar-mobile";
import { ModernTopBar } from "@/components/organisms/modern-top-bar";
import {
  setIsLoggedIn,
  useAppState,
} from "@/components/providers/app-state-provider";
import fetcher from "@/lib/core/fetcher";
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

  const [showMonogram, setShowMonogram] = useState(false);
  const [monogramDone, setMonogramDone] = useState(false);

  // Fetch profile data for the monogram display name
  const isMember = data?.user?.kind === "member";
  const isAdminMember = data?.user?.kind === "admin-member";
  const isSuperAdmin = data?.user?.kind === "admin";

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
    enabled: (isMember || isAdminMember) && !!data?.isLoggedIn,
  });

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

  // Show welcome monogram on first dashboard load per session
  useEffect(() => {
    if (data?.isLoggedIn && !isLoading) {
      const hasSeenMonogram = sessionStorage.getItem("peacock-monogram-shown");
      if (!hasSeenMonogram) {
        setShowMonogram(true);
        sessionStorage.setItem("peacock-monogram-shown", "true");
      } else {
        setMonogramDone(true);
      }
    }
  }, [data?.isLoggedIn, isLoading]);

  const handleMonogramComplete = useCallback(() => {
    setShowMonogram(false);
    setMonogramDone(true);
  }, []);

  // Determine display name for monogram
  const displayName = isSuperAdmin
    ? "Super Admin"
    : profileData?.account
      ? `${profileData.account.firstName || ""} ${profileData.account.lastName || ""}`.trim() ||
        profileData.account.username
      : "Member";

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
    <>
      {/* Welcome Monogram overlay */}
      {showMonogram && (
        <WelcomeMonogram
          name={displayName}
          onComplete={handleMonogramComplete}
        />
      )}

      {/* Dashboard content - render after monogram completes */}
      <AnimatePresence>
        {monogramDone && (
          <motion.div
            className="main-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
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
                <div className="w-full flex h-full p-6 pb-20 lg:pb-6">
                  {children}
                </div>
              </div>
            </main>
            <ModernSidebarMobile />
            <MobileBottomNav />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
