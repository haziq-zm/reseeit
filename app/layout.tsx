import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { NavBar } from "@/components/NavBar";
import { Providers } from "@/components/Providers";
import { ThemeShell } from "@/components/ThemeShell";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Smart Receipt AI",
  description: "OCR receipts, track weekly budget, and find cheaper alternatives.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <Providers>
          <ThemeShell>
            <NavBar />
            <main className="mx-auto max-w-3xl px-4 py-6 pb-16">{children}</main>
          </ThemeShell>
        </Providers>
      </body>
    </html>
  );
}
