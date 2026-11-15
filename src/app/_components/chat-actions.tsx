"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Plus, Settings } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";

function ThemeSetting() {
  const { resolvedTheme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="group"
      aria-label="Theme"
      className="bg-secondary flex rounded-xl p-1"
    >
      {(["light", "dark"] as const).map((theme) => (
        <button
          key={theme}
          type="button"
          aria-pressed={resolvedTheme === theme}
          onClick={() => setTheme(theme)}
          className={`focus-visible:outline-ring relative min-h-11 flex-1 touch-manipulation rounded-lg px-3 text-sm font-medium capitalize select-none focus-visible:outline-2 focus-visible:outline-offset-2 ${resolvedTheme === theme ? "text-foreground" : "text-muted-foreground"}`}
        >
          {resolvedTheme === theme && (
            <motion.span
              layoutId="selected-theme"
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", bounce: 0, duration: 0.25 }
              }
              className="bg-popover absolute inset-0 rounded-lg shadow-sm"
              aria-hidden="true"
            />
          )}
          <span className="relative">{theme}</span>
        </button>
      ))}
    </div>
  );
}

export function ChatActions({
  newChat,
  hasMessages,
}: {
  newChat: () => void;
  hasMessages: boolean;
}) {
  return (
    <div className="sticky top-[max(1rem,env(safe-area-inset-top))] z-20 mx-auto -mb-11 flex h-11 w-full max-w-3xl items-center justify-between">
      <Button
        variant="secondary"
        size="icon-lg"
        type="button"
        onClick={newChat}
        disabled={!hasMessages}
        aria-label="New chat"
        className="bg-card/50 rounded-xl shadow-sm backdrop-blur-sm transition-[transform,background-color,color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:translate-y-0 motion-reduce:active:scale-100"
      >
        <Plus className="size-5" aria-hidden="true" />
      </Button>
      <Drawer showSwipeHandle>
        <DrawerTrigger
          render={
            <Button
              variant="secondary"
              size="icon-lg"
              className="bg-card/50 rounded-xl shadow-sm backdrop-blur-sm transition-[transform,background-color,color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:translate-y-0 motion-reduce:active:scale-100"
            />
          }
          aria-label="Open settings"
        >
          <Settings className="size-5" aria-hidden="true" />
        </DrawerTrigger>
        <DrawerContent className="mx-auto w-full max-w-lg overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] motion-reduce:transition-none sm:px-6">
          <DrawerHeader className="flex-row items-start justify-between gap-4 px-1 pt-5 pb-7 text-left">
            <div>
              <DrawerTitle className="text-left text-4xl tracking-tight normal-case">
                Settings
              </DrawerTitle>
              <DrawerDescription className="mt-1 text-left text-sm">
                Theme and Gemini usage
              </DrawerDescription>
            </div>
          </DrawerHeader>
          <section aria-labelledby="appearance-heading" className="space-y-2">
            <h3
              id="appearance-heading"
              className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase"
            >
              Appearance
            </h3>
            <ThemeSetting />
          </section>
          <section aria-labelledby="gemini-heading" className="mt-6 space-y-2">
            <h3
              id="gemini-heading"
              className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase"
            >
              Gemini
            </h3>
            <a
              href="https://aistudio.google.com/rate-limit?timeRange=last-28-days"
              target="_blank"
              rel="noopener noreferrer"
              className="border-border focus-visible:outline-ring active:bg-accent hover:bg-accent flex min-h-16 touch-manipulation items-center justify-between gap-3 border-b px-1 py-3 select-none focus-visible:outline-2 focus-visible:outline-offset-2 active:opacity-70"
            >
              <span>
                <span className="block text-sm font-medium">Rate limits</span>
                <span className="text-muted-foreground mt-1 block text-xs">
                  View current usage in AI Studio
                </span>
              </span>
              <ExternalLink
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden="true"
              />
            </a>
          </section>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
