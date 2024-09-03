"use client";
import SideMenu from "@/components/organisms/side-menu";
import SideMenuMobile from "@/components/organisms/side-menu-mobile";
import TopMenu from "@/components/organisms/top-menu";
import { store } from "@/store";
import { setIsLoggedIn } from "@/store/pageSlice";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/status", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          dispatch(setIsLoggedIn(data.isLoggedIn));
        } else {
          dispatch(setIsLoggedIn(false));
        }
      } catch (error) {
        console.error("Failed to fetch auth status:", error);
        dispatch(setIsLoggedIn(false));
      }
    };

    checkAuth();
  }, [dispatch]);

  return (
    <div className="main-wrapper">
      <main className={"page-main bg-paper"}>
        <TopMenu className="fixed z-30 block w-full bg-background" />
        <SideMenu />
        <div
          className={
            "h-full min-h-svh w-full transition-all duration-300 max-w-7xl max-w-[2000px] m-auto mt-0 pt-[61px]"
          }
        >
          <div className="w-full flex h-full px-2 py-8">{children}</div>
        </div>
      </main>
      <SideMenuMobile />
    </div>
  );
}
