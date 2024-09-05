"use client";

import { IconType } from "react-icons/lib";
import { Button } from "../ui/button";
import { CustomLink } from "../ui/link";
import Box from "../ui/box";
import { IoClose } from "react-icons/io5";
import { ScrollArea } from "../ui/scroll-area";
import { FaPeopleGroup } from "react-icons/fa6";
import Typography from "../ui/typography";
import { Separator } from "../ui/separator";
import { clubAge } from "@/lib/date";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import { setIsLoggedIn } from "@/store/pageSlice";
import ActionMenu from "../molecules/action-menu";
import { HiBriefcase } from "react-icons/hi";
import { RiFolderTransferFill } from "react-icons/ri";
import { FaPiggyBank } from "react-icons/fa";
import { PiSignInBold } from "react-icons/pi";
import { PiSignOutBold } from "react-icons/pi";
import { TbLayoutDashboardFilled } from "react-icons/tb";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import fetcher from "@/lib/fetcher";

type Menu = {
  Icon: IconType;
  label: string;
  active?: boolean;
  link?: string;
};

const appMenus: Menu[] = [
  {
    Icon: TbLayoutDashboardFilled,
    label: "Dashboard",
    link: "/dashboard",
  },
  {
    Icon: FaPeopleGroup,
    label: "Members",
    link: "/dashboard/member",
  },
  {
    Icon: HiBriefcase,
    label: "Vendors",
    link: "/dashboard/vendor",
  },
];

const transactionsMenus: Menu[] = [
  {
    Icon: FaPiggyBank,
    label: "Member Transactions",
    link: "/dashboard/member/transaction",
  },
  {
    Icon: RiFolderTransferFill,
    label: "Vendor Transactions",
    link: "/dashboard/vendor/transaction",
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
  const queryClient = useQueryClient();

  const isLoggedIn = useSelector((state: RootState) => state.page.isLoggedIn);

  const handleOnItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  const mutation = useMutation({
    mutationFn: () => fetcher.post("/api/auth/logout"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["auth"],
      });

      dispatch(setIsLoggedIn(false));
      toast.success("Logged out successfully!");
      router.push("/login"); // Redirect to the dashboard or any protected route
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  const handleLogout = async () => {
    return await mutation.mutateAsync();
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
      <Box preset={"stack-center"} className="gap-0 pr-4 pb-2">
        <Typography variant={"brandMini"} className="w-full text-center">
          Peacock Club
        </Typography>
        <p className="text-xs text-foreground/70">{clubAge().inYear}</p>
      </Box>
      <Separator className="my-2" />

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
          <Separator className="my-2" />
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

          {isLoggedIn && (
            <>
              <Separator className="my-2" />
              <ActionMenu />
            </>
          )}

          <Separator className="my-2" />

          {isLoggedIn && (
            <Button
              variant={"menu"}
              onClick={() => {
                handleLogout();
                handleOnItemClick();
              }}
            >
              <PiSignOutBold className="h-5 w-5" /> Logout
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
              <PiSignInBold className="h-5 w-5" /> Login
            </CustomLink>
          )}
        </Box>
      </ScrollArea>
    </Box>
  );
}

export default MenuItems;
