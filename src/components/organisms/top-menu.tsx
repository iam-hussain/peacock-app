"use client";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useWindowScroll } from "react-use";

import { RootState } from "@/store";
import { openSideBar } from "@/store/pageSlice";
import Box from "../ui/box";
import { Button } from "../ui/button";
import { IoClose } from "react-icons/io5";
import { HiMenuAlt2 } from "react-icons/hi";
import Typography from "../ui/typography";
import { CustomLink } from "../ui/link";
``;

const animator = {
  hide: {
    y: -64,
    transition: {
      duration: 0.3,
    },
  },
  show: {
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

function TopMenu({ className }: { className?: string }) {
  const { y } = useWindowScroll();
  const dispatch = useDispatch();
  const [scrollDirection, setScrollDirection] = useState("IDEAL");
  const sideBarOpen = useSelector((state: RootState) => state.page.sideBarOpen);

  const callback = useCallback(
    (event: any) => {
      if (sideBarOpen) {
        return setScrollDirection("IDEAL");
      }
      if ((event.wheelDelta && event.wheelDelta > 0) || event.deltaY < 0) {
        return setScrollDirection("UP");
      } else {
        setScrollDirection("DOWN");
      }
    },
    [sideBarOpen],
  );

  const shouldHide = useMemo(() => {
    return y <= 100 || scrollDirection === "UP";
  }, [scrollDirection, y]);

  useEffect(() => {
    document.body.addEventListener("wheel", callback);
    return () => document.body.removeEventListener("file-upload", callback);
  }, [callback]);

  return (
    <motion.nav
      className={clsx(
        "lg:pl-[350px] w-full h-[60px] align-middle items-center fixed px-4 lg:px-8 flex justify-start lg:justify-center",
        className,
      )}
      initial="show"
      variants={animator}
      transition={{ type: "spring", stiffness: 100 }}
      animate={shouldHide ? "show" : "hide"}
    >
      <Box className="w-auto" gap={6} preset={"row-center"}>
        <Button
          variant={"outline"}
          size={"icon"}
          onClick={() => dispatch(openSideBar())}
          className="lg:hidden"
        >
          {sideBarOpen ? <IoClose /> : <HiMenuAlt2 />}
        </Button>

        <CustomLink href={"/"} variant={"transparent"} className="p-0 px-3">
          <Typography variant={"brandMini"}>Peacock Club</Typography>
        </CustomLink>
      </Box>
    </motion.nav>
  );
}

export default TopMenu;
