"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import MenuItems from "./menu-items";

import { animateDecorator } from "@/lib/ui/animate";
import { cn } from "@/lib/ui/utils";
import { RootState } from "@/store";
import { openSideBar } from "@/store/pageSlice";

const variants = {
  initial: { x: -400, transition: { duration: 0.3, ease: "linear" } },
  full: {
    x: 0,
    transition: { delayChildren: 0.5, duration: 0.3, ease: "linear" },
  },
};

function SideMenuMobile({ className }: { className?: string }) {
  const sideBarOpen = useSelector((state: RootState) => state.page.sideBarOpen);
  const dispatch = useDispatch();

  useEffect(() => {
    document.body.style.overflow = sideBarOpen ? "hidden" : "unset";
  }, [sideBarOpen]);

  const handleSidebarToggle = () => dispatch(openSideBar());

  return (
    <>
      <motion.div
        initial="hide"
        variants={animateDecorator}
        animate={sideBarOpen ? "show" : "hide"}
        onClick={handleSidebarToggle}
        className="fixed left-0 w-screen h-full bg-foreground/40 min-h-fill lg:hidden"
      />
      <motion.div
        initial="initial"
        animate={sideBarOpen ? "full" : "initial"}
        variants={variants}
        className={cn(
          "side-menu bg-background p-6 z-50 relative left-0 items-start rounded-tr-xl rounded-br-xl w-[300px] lg:hidden shadow-sm py-10",
          className
        )}
      >
        <MenuItems onItemClick={handleSidebarToggle} hasCloseButton={true} />
      </motion.div>
    </>
  );
}

export default SideMenuMobile;
