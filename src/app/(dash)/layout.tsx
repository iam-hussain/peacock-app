'use client'
import SideMenu from "@/components/side-menu";
import TopMenu from "@/components/top-menu";
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { useSelector } from "react-redux";


export default function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const topBarOpen = useSelector((state: RootState) => state.page.topBarOpen);
    return (
        <div className="main-wrapper">
            <main className={"page-main bg-paper"}>
                <TopMenu
                    className="fixed z-30 block w-full bg-background"
                    showSideBar={true}
                />
                <div
                    className={cn(
                        "h-full min-h-svh w-full transition-all duration-300 max-w-7xl m-auto mt-0",
                        {
                            "pt-[61px]": topBarOpen,
                        }
                    )}
                >
                    <div className="w-full flex h-full px-2 py-8">
                        {children}
                    </div>
                </div>
            </main>
            <SideMenu />
        </div>
    );
}
