export const fetchCache = "force-no-store";
export const dynamic = "force-dynamic";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";

import "../styles/globals.css";

import QueryProvider from "@/components/providers/query-provider";
import StoreProvider from "@/components/providers/store-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Peacock Club",
  description: "Creating the environment for business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-paper">
      <head>
        {/* Resource Hints for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {/* Preload critical assets */}
        <link
          rel="preload"
          href="/peacock.svg"
          as="image"
          type="image/svg+xml"
        />
      </head>
      <body className="bg-paper">
        <Analytics />
        <QueryProvider>
          <StoreProvider>
            <ThemeProvider>
              {children}
              <Toaster position="bottom-right" />
            </ThemeProvider>
          </StoreProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
