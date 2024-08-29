
import SideMenu from "@/components/side-menu";
import SideMenuMobile from "@/components/side-menu-mobile";
import TopMenu from "@/components/top-menu";
import { store } from "@/store";

export default function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="main-wrapper">
            <main className={"page-main bg-paper"}>
                <TopMenu
                    className="fixed z-30 block w-full bg-background"
                />
                <SideMenu />
                <div
                    className={"h-full min-h-svh w-full transition-all duration-300 max-w-7xl m-auto mt-0 pt-[61px]"}
                >
                    <div className="w-full flex h-full px-2 py-8">
                        {children}
                    </div>
                </div>
            </main>
            <SideMenuMobile />
        </div>
    );
}
