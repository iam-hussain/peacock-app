import type { Metadata } from "next";
import "../styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import StoreProvider from "@/components/store-provider";

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
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
      <Toaster />
    </html>
  );
}
