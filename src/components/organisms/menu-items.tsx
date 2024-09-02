"use client";

import { IconType } from "react-icons/lib";
import { Button } from "../ui/button";
import { CustomLink } from "../ui/link";
import Box from "../ui/box";
import { IoClose } from "react-icons/io5";
import { ScrollArea } from "../ui/scroll-area";
import { FaPeopleGroup } from "react-icons/fa6";
import { BsMotherboard } from "react-icons/bs";
import { PiHandDepositDuotone } from "react-icons/pi";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { IoMdLogIn } from "react-icons/io";

import { RiHome5Fill } from "react-icons/ri";
import Typography from "../ui/typography";
import { Separator } from "../ui/separator";
import { clubAge } from "@/lib/date";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import { setIsLoggedIn } from "@/store/pageSlice";
import BackupAction from "../molecules/backup-action";

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
    link: "/home",
  },
  {
    Icon: FaPeopleGroup,
    label: "Members",
    link: "/members",
  },
  {
    Icon: BsMotherboard,
    label: "Vendors",
    link: "/vendors",
  },
];

const transactionsMenus: Menu[] = [
  {
    Icon: PiHandDepositDuotone,
    label: "Members Transaction",
    link: "/members/transactions",
  },
  {
    Icon: FaMoneyBillTransfer,
    label: "Vendors Transaction",
    link: "/vendors/transactions",
  },
];

function MenuItems({
  onItemClick,
  hasCloseButton = false,
}: {
  onItemClick?: () => {};
  hasCloseButton?: boolean;
}) {
  const router = useRouter();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state: RootState) => state.page.isLoggedIn);

  const handleOnItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  const handleLogout = async () => {
    dispatch(setIsLoggedIn(false));
    // Clear the token cookie by setting it to expire
    await fetch("/api/login/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    document.cookie = "token=; Max-Age=0; path=/";
    Cookies.remove("token");
    toast.success("Logged out successfully!");
    router.push("/login"); // Redirect to the login page
  };

  return (
    <Box preset={"stack-start"} className="h-full overflow-hidden">
      {hasCloseButton && (
        <Box className="absolute top-2 right-2 w-auto">
          <Button variant={"ghost"} size={"icon"} onClick={handleOnItemClick}>
            <IoClose className="h-6 w-6" />
          </Button>
        </Box>
      )}
      <Box preset={"stack-center"} className="gap-0 pr-4 md:hidden">
        <Typography variant={"brandMini"} className="w-full text-center">
          Peacock Club
        </Typography>
        <p className="text-xs text-foreground/70">{clubAge().inYear}</p>
      </Box>
      <Separator className="my-4 md:hidden" />

      <ScrollArea className="w-full grow">
        <Box preset={"stack-start"} className="gap-4" gap={1}>
          {appMenus.map(({ Icon, ...each }, key) => (
            <CustomLink
              key={key}
              variant={"menu"}
              href={each.link as any}
              onClick={() => handleOnItemClick()}
            >
              <Icon className="h-5 w-5" /> {each.label}
            </CustomLink>
          ))}
          <Separator className="my-4" />
          {transactionsMenus.map(({ Icon, ...each }, key) => (
            <CustomLink
              key={key}
              variant={"menu"}
              href={each.link as any}
              onClick={() => handleOnItemClick()}
            >
              <Icon className="h-5 w-5" /> {each.label}
            </CustomLink>
          ))}

          {isLoggedIn && <>
              <Separator className="my-4" />
              <BackupAction />
          </>}

          <Separator className="my-4" />

          {isLoggedIn && (
            <Button
              variant={"menu"}
              onClick={() => {
                handleLogout();
                handleOnItemClick();
              }}
            >
              <IoMdLogIn className="h-5 w-5" /> Logout
            </Button>
          )}

          {!isLoggedIn && (
            <CustomLink
              variant={"menu"}
              href={"/login"}
              onClick={() => {
                handleLogout();
                handleOnItemClick();
              }}
            >
              <IoMdLogIn className="h-5 w-5" /> Login
            </CustomLink>
          )}


        </Box>
      </ScrollArea>
    </Box>
  );
}

export default MenuItems;
