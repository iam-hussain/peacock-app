"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.97, filter: "blur(6px)" },
};

const pageTransition = {
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1],
};

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="w-full"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}
