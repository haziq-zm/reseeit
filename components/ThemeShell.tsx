"use client";

import { useAppStore } from "@/stores/useAppStore";
import { useEffect } from "react";

/** Applies dark/light class from Zustand (bonus dark mode toggle). */
export function ThemeShell({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", dark);
    }
  }, [theme]);

  return <>{children}</>;
}
