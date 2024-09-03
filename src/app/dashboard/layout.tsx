"use client";
import SideMenu from "@/components/organisms/side-menu";
import SideMenuMobile from "@/components/organisms/side-menu-mobile";
import TopMenu from "@/components/organisms/top-menu";
import { fetchAuthStatus } from "@/lib/query-options";
import { setIsLoggedIn } from "@/store/pageSlice";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dispatch = useDispatch();
  const { data, isLoading, isError } = useQuery(fetchAuthStatus());

  useEffect(() => {
    if (data) {
      dispatch(setIsLoggedIn(data.isLoggedIn));
    }

    if (isError) {
      dispatch(setIsLoggedIn(false));
    }
  }, [data, isError, isLoading, dispatch]);

  return (
    <div className="main-wrapper">
      <main className={"page-main bg-paper"}>
        <TopMenu className="fixed z-30 block w-full bg-background" />
        <SideMenu />
        <div
          className={
            "h-full min-h-svh w-full transition-all duration-300 max-w-screen-2xl m-auto mt-0 pt-[48px] lg:pl-[300px]"
          }
        >
          <div className="w-full flex h-full p-6">{children}</div>
        </div>
      </main>
      <SideMenuMobile />
    </div>
  );
}
