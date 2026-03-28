"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
];

export function NavBar() {
  const pathname = usePathname();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <header className="sticky top-0 z-40 border-b border-wheat/60 bg-cream/85 shadow-soft backdrop-blur-md dark:border-wheat/10 dark:bg-charcoal/90 dark:shadow-soft-dark">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="group flex items-baseline gap-1.5">
          <span className="text-[0.9375rem] font-semibold tracking-tight text-ink dark:text-sand">
            Smart Receipt
          </span>
          <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-accent dark:bg-accent/25 dark:text-accent-muted">
            AI
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground shadow-sm dark:bg-accent-muted dark:text-ink"
                    : "text-ink/55 hover:bg-sand/80 hover:text-ink dark:text-sand/55 dark:hover:bg-ink dark:hover:text-sand"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <label className="sr-only" htmlFor="nav-theme">
            Theme
          </label>
          <select
            id="nav-theme"
            aria-label="Theme"
            value={theme}
            onChange={(e) =>
              setTheme(e.target.value as "system" | "light" | "dark")
            }
            className="ml-1 cursor-pointer rounded-lg border border-wheat/80 bg-cream py-1.5 pl-2 pr-7 text-xs text-ink/70 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/25 dark:border-wheat/15 dark:bg-ink dark:text-sand/80"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </nav>
      </div>
    </header>
  );
}
