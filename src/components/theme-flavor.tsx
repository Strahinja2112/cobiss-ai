"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const themeFlavors = ["olive", "sage", "rose", "ocean"] as const;
export type ThemeFlavor = (typeof themeFlavors)[number];

const FlavorContext = createContext<{
  flavor: ThemeFlavor;
  setFlavor: (flavor: ThemeFlavor) => void;
} | null>(null);

export function ThemeFlavorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [flavor, setFlavor] = useState<ThemeFlavor>("olive");

  useEffect(() => {
    const saved = window.localStorage.getItem("theme-flavor");
    if (themeFlavors.includes(saved as ThemeFlavor))
      setFlavor(saved as ThemeFlavor);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove(
      ...themeFlavors.map((item) => `flavor-${item}`),
    );
    document.documentElement.classList.add(`flavor-${flavor}`);
    window.localStorage.setItem("theme-flavor", flavor);
  }, [flavor]);

  return (
    <FlavorContext.Provider value={{ flavor, setFlavor }}>
      {children}
    </FlavorContext.Provider>
  );
}

export function useThemeFlavor() {
  const context = useContext(FlavorContext);
  if (!context)
    throw new Error("useThemeFlavor must be used within ThemeFlavorProvider");
  return context;
}
