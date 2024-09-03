import type { Metadata } from "next";
import "../styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import StoreProvider from "@/components/providers/store-provider";
import QueryProvider from "@/components/providers/query-provider";

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
    <html lang="en" data-theme="light">
      <body className="bg-paper">
        <QueryProvider>
          <StoreProvider>{children}</StoreProvider>
        </QueryProvider>
      </body>
      <Toaster position="top-right" />
    </html>
  );
}
