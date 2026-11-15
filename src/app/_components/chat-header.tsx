"use client";

import { ExternalLink, Settings2 } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";

function ThemeSetting() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div role="group" aria-label="Theme" className="bg-secondary flex rounded-xl p-1">
      {(["light", "dark"] as const).map((theme) => (
        <button
          key={theme}
          type="button"
          aria-pressed={resolvedTheme === theme}
          onClick={() => setTheme(theme)}
          className={`focus-visible:outline-ring min-h-11 flex-1 touch-manipulation rounded-lg px-3 text-sm font-medium capitalize select-none active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 ${resolvedTheme === theme ? "bg-popover text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          {theme}
        </button>
      ))}
    </div>
  );
}

export function ChatHeader() {
  return (
    <header className="border-border w-full border-b pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:min-h-20 sm:px-8">
        <h1 className="text-sm font-semibold tracking-tight sm:text-base">
          COBISS Book Finder
        </h1>
        <Drawer showSwipeHandle>
          <DrawerTrigger
            aria-label="Open settings"
            className="focus-visible:outline-ring flex size-11 touch-manipulation items-center justify-center rounded-xl select-none active:scale-[0.96] active:bg-accent hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Settings2 className="size-5" aria-hidden="true" />
          </DrawerTrigger>
          <DrawerContent className="mx-auto w-full max-w-lg overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] motion-reduce:transition-none sm:px-6">
            <DrawerHeader className="flex-row items-start justify-between gap-4 px-1 pt-5 pb-7 text-left">
              <div>
                <DrawerTitle className="text-3xl tracking-tight normal-case">
                  Settings
                </DrawerTitle>
                <DrawerDescription className="mt-1 text-left text-sm">
                  Appearance and Gemini usage
                </DrawerDescription>
              </div>
              <DrawerClose
                className="text-primary focus-visible:outline-ring flex min-h-11 shrink-0 touch-manipulation items-center rounded-lg px-2 text-sm font-semibold select-none active:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Done
              </DrawerClose>
            </DrawerHeader>
            <section aria-labelledby="appearance-heading" className="space-y-2">
              <h3 id="appearance-heading" className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase">
                Appearance
              </h3>
              <ThemeSetting />
            </section>
            <section aria-labelledby="gemini-heading" className="mt-6 space-y-2">
              <h3 id="gemini-heading" className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase">
                Gemini
              </h3>
              <a
                href="https://aistudio.google.com/rate-limit?timeRange=last-28-days"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary/70 focus-visible:outline-ring flex min-h-16 touch-manipulation items-center justify-between gap-3 rounded-2xl px-4 py-3 select-none active:scale-[0.99] active:bg-accent hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span>
                  <span className="block text-sm font-medium">Rate limits</span>
                  <span className="text-muted-foreground mt-1 block text-xs">
                    View current usage in AI Studio
                  </span>
                </span>
                <ExternalLink className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
              </a>
            </section>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
}
