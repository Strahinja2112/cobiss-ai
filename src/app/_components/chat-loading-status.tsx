"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Spinner } from "~/components/ui/spinner";

const quips = [
  "Consulting the tiny librarians…",
  "Untangling one very twisty plot…",
  "Shuffling the imaginary index cards…",
  "Asking the bookmark committee…",
  "Checking the margins for clues…",
  "Convincing the book cart to cooperate…",
];

export function ChatLoadingStatus({ reduceMotion }: { reduceMotion: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % quips.length),
      2400,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <p
      role="status"
      aria-live="polite"
      className="text-muted-foreground flex items-center gap-2 text-sm"
    >
      <Spinner aria-hidden="true" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          initial={{
            opacity: 0,
            transform: reduceMotion ? "none" : "translateY(4px)",
          }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          exit={{
            opacity: 0,
            transform: reduceMotion ? "none" : "translateY(-4px)",
          }}
          transition={{
            duration: reduceMotion ? 0.12 : 0.18,
            ease: [0.23, 1, 0.32, 1],
          }}
        >
          {quips[index]}
        </motion.span>
      </AnimatePresence>
    </p>
  );
}
