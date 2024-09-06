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
      <body className="bg-paper">
        <QueryProvider>
          <StoreProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </StoreProvider>
        </QueryProvider>
      </body>
      <Toaster position="top-right" />
    </html>
  );
}
