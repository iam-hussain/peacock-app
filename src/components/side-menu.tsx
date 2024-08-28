'use client'
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { openSideBar } from "@/store/pageSlice";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons/lib";
import { animateDecorator } from "@/lib/animate";
import { Button } from "./ui/button";
import { CustomLink } from "./ui/link";
import Box from "./ui/box";
import { IoClose } from "react-icons/io5";
import { ScrollArea } from "./ui/scroll-area";
import { FaPeopleGroup } from "react-icons/fa6";
import { BsMotherboard } from "react-icons/bs";
import { PiHandDepositDuotone } from "react-icons/pi";
import { FaMoneyBillTransfer } from "react-icons/fa6";

import { RiHome5Fill } from "react-icons/ri";
import Typography from "./ui/typography";
import { Separator } from "./ui/separator";
import { clubAge } from "@/lib/date";

type Menu = {
  Icon: IconType;
  label: string;
  active?: boolean;
  link?: string;
};

const appMenus: Menu[] = [
  {
    Icon: RiHome5Fill,
    label: "Home",
    link: '/home'
  },
  {
    Icon: FaPeopleGroup,
    label: "Members",
    link: '/members'
  }, {
    Icon: PiHandDepositDuotone,
    label: "Members Transaction",
    link: '/members/transactions'
  }, {
    Icon: BsMotherboard,
    label: "Vendors",
    link: '/vendors'
  }, {
    Icon: FaMoneyBillTransfer,
    label: "Vendors Transaction",
    link: '/vendors/transactions'
  }
];

const settingMenus: Menu[] = [
  {
    Icon: FaMoneyBillTransfer,
    label: "Login",
    link: '/vendors/transactions'
  }
];

const variants = {
  initial: { x: -400, transition: { duration: 0.3, ease: "linear" } },
  full: {
    x: 0,
    transition: { delayChildren: 0.5, duration: 0.3, ease: "linear" },
  },
};

function SideMenu({ className }: { className?: string }) {
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
        className="fixed left-0 w-screen h-full bg-foreground/40 min-h-fill"
      />
      <motion.div
        initial="initial"
        animate={sideBarOpen ? "full" : "initial"}
        variants={variants}
        className={cn(
          "side-menu bg-background p-6 z-50 relative left-0 items-start rounded-tr-xl rounded-br-xl w-[300px]",
          className
        )}
      >
        <Box preset={"stack-start"} className="h-full overflow-hidden">
          <Box className="absolute top-2 right-2 w-auto">
            <Button
              variant={"ghost"}
              size={"icon"}
              onClick={handleSidebarToggle}
            >
              <IoClose className="h-6 w-6" />
            </Button>
          </Box>
          <Box preset={'stack-center'} className="gap-0 pr-4">
            <Typography variant={'brandMini'} className="w-full text-center">Peacock Club</Typography>
            <p className="text-xs text-foreground/70">{clubAge().inYear}</p>
          </Box>
          <Separator className=" md:hidden" />

          <ScrollArea className="w-full grow">
            <Box preset={"stack-start"} className="py-4" gap={1}>
              {appMenus.map(({ Icon, ...each }, key) => (
                <CustomLink
                  key={key}
                  variant={"menu"}
                  href={each.link as any}
                  onClick={() => handleSidebarToggle()}

                >
                  <Icon className="h-5 w-5" />  {each.label}
                </CustomLink>
              ))}
              <Separator className="my-2" />
              {settingMenus.map(({ Icon, ...each }, key) => (
                <CustomLink
                  key={key}
                  variant={"menu"}
                  href={each.link as any}
                  onClick={() => handleSidebarToggle()}
                >
                  <Icon className="h-5 w-5" />  {each.label}
                </CustomLink>
              ))}
            </Box>
          </ScrollArea>
        </Box>
      </motion.div>
    </>
  );
}

export default SideMenu;
