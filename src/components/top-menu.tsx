'use client'
import clsx from "clsx";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useWindowScroll } from "react-use";

import { RootState } from "@/store";
import { openSideBar, openTopBar, } from "@/store/pageSlice";
import Box from "./ui/box";
import { Icon } from "lucide-react";
import { ThemeModeToggle } from "./theme-mode-toggle";
import { Button } from "./ui/button";
import {
  IoClose,
} from "react-icons/io5";
import { HiMenuAlt2 } from "react-icons/hi";
import Typography from "./ui/typography";
import { BiHide, BiShow } from "react-icons/bi";

const closerButton = {
  initial: {},
  pressed: { scale: 0.9 },
  hover: {
    y: 70,
    opacity: 1,
  },
  out: {
    opacity: 1,
    y: 60,
    x: 0,
    transition: {
      duration: 0.6,
    },
  },
  in: {
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

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

function TopMenu({
  className,
  showSideBar,
}: {
  className?: string;
  showSideBar: boolean;
}) {
  const { y } = useWindowScroll();
  const dispatch = useDispatch();
  const [scrollDirection, setScrollDirection] = useState("IDEAL");
  const sideBarOpen = useSelector((state: RootState) => state.page.sideBarOpen);
  const topBarOpen = useSelector((state: RootState) => state.page.topBarOpen);

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
    [sideBarOpen]
  );

  const shouldHide = useMemo(() => {
    return topBarOpen && (y <= 100 || scrollDirection === "UP");
  }, [topBarOpen, scrollDirection, y]);

  useEffect(() => {
    document.body.addEventListener("wheel", callback);
    return () => document.body.removeEventListener("file-upload", callback);
  }, [callback]);

  return (
    <motion.nav
      className={clsx(
        "border-b w-full h-[60px] align-middle items-center fixed px-4 md:px-8 flex justify-between",
        className
      )}
      initial="show"
      variants={animator}
      transition={{ type: "spring", stiffness: 100 }}
      animate={shouldHide ? "show" : "hide"}
    >
      <Box className="w-auto" gap={6} preset={'row-center'}>
        {showSideBar ? (
          <Button
            variant={"outline"}
            size={"icon"}
            onClick={() => dispatch(openSideBar())}
          >
            {sideBarOpen ? <IoClose /> : <HiMenuAlt2 />}
          </Button>
        ) : (
          <></>
        )}

        <Typography variant={'brandMini'}>Peacock Club</Typography>
      </Box>

      <Box className="w-auto" gap={2}>
        <motion.div
          initial="initial"
          whileTap="pressed"
          transition={{ type: "spring", stiffness: 100 }}
          animate={topBarOpen ? "in" : "out"}
          variants={closerButton}
          className="hidden w-auto h-auto right-4 md:flex"
          tabIndex={-1}
        >
          <Button
            variant={"outline"}
            size={"icon"}
            onClick={() => {
              if (!topBarOpen) {
                setScrollDirection("UP");
              }
              dispatch(openTopBar());
            }}
          >
            {topBarOpen ? <BiShow /> : <BiHide />}
          </Button>
        </motion.div>
      </Box>
    </motion.nav>
  );
}

export default TopMenu;
