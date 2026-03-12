"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface WelcomeMonogramProps {
  name: string;
  onComplete: () => void;
}

export default function WelcomeMonogram({
  name,
  onComplete,
}: WelcomeMonogramProps) {
  const [visible, setVisible] = useState(true);

  // Extract initials
  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join(". ")
      .toUpperCase() + ".";

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 600); // wait for exit animation
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            className="font-brand text-6xl md:text-8xl tracking-widest text-gold-gradient"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {initials}
          </motion.span>
          <motion.p
            className="mt-4 text-sm tracking-[0.2em] uppercase text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Welcome back to the Club
          </motion.p>
          <motion.div
            className="mt-6 gold-line w-16"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
