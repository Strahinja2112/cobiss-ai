"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { RefObject } from "react";

import type { ChatRecommendation } from "~/app/api/_lib/chat";
import { Button } from "~/components/ui/button";

export function ChatBookDetails({
  selected,
  details,
  closeButton,
  closeDetails,
}: {
  selected: ChatRecommendation | null;
  details: [string, string[]][];
  closeButton: RefObject<HTMLButtonElement | null>;
  closeDetails: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {selected && (
        <motion.aside
          key={selected.id}
          initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
          transition={
            reduceMotion
              ? { duration: 0.16 }
              : { type: "spring", bounce: 0, duration: 0.38 }
          }
          aria-label={`Details for ${selected.title}`}
          className="bg-card text-card-foreground lg:border-border fixed inset-0 z-30 overflow-y-auto p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:sticky lg:top-6 lg:mt-6 lg:h-[calc(100dvh-3rem)] lg:rounded-2xl lg:border lg:py-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="min-w-0 text-2xl font-semibold tracking-tight break-words">
                {selected.title}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {selected.authors.join(" · ") || "Author unknown"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-lg"
              ref={closeButton}
              type="button"
              onClick={closeDetails}
              className="rounded-xl"
              aria-label="Close book details"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-6 text-sm leading-7">{selected.summary}</p>
          <div className="border-border mt-6 space-y-4 border-t pt-5 text-sm">
            {details.map(([label, values]) =>
              values.length ? (
                <div key={label}>
                  <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {label}
                  </h3>
                  <p className="mt-1 leading-6">{values.join(", ")}</p>
                </div>
              ) : null,
            )}
          </div>
          <a
            href={selected.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-block text-sm underline underline-offset-4"
          >
            View COBISS record
          </a>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
