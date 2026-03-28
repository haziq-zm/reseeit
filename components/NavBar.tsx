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
    <header className="sticky top-0 z-40 border-b border-wheat/80 bg-cream/95 backdrop-blur-md dark:border-wheat/15 dark:bg-charcoal/95">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight text-ink dark:text-sand">
          Smart Receipt <span className="text-ink/60 dark:text-wheat">AI</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-ink text-cream dark:bg-sand dark:text-ink"
                    : "text-ink/70 hover:bg-sand/80 dark:text-sand/80 dark:hover:bg-ink/60"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <select
            aria-label="Theme"
            value={theme}
            onChange={(e) =>
              setTheme(e.target.value as "system" | "light" | "dark")
            }
            className="ml-2 rounded-lg border border-wheat bg-cream px-2 py-1.5 text-xs text-ink dark:border-wheat/25 dark:bg-ink dark:text-sand"
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
