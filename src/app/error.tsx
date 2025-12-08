"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Home, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { ThemeModeToggle } from "@/components/molecules/theme-mode-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fetchAuthStatus } from "@/lib/query-options";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const { data: authData } = useQuery(fetchAuthStatus());
  const isLoggedIn = authData?.isLoggedIn ?? false;
  const isDashboardRoute = pathname?.startsWith("/dashboard") ?? false;

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="absolute right-4 top-4">
        <ThemeModeToggle />
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Illustration */}
          <div className="hidden lg:flex flex-col items-center justify-center relative">
            <div className="relative w-full max-w-md">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent rounded-3xl blur-3xl" />

              {/* Logo */}
              <div className="relative flex flex-col items-center gap-6 p-12">
                <div className="relative h-32 w-32">
                  <Image
                    src="/peacock.svg"
                    alt="Peacock Club"
                    fill
                    className="object-contain opacity-80"
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">
                    Peacock Club
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Community Financial Group
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Content Card */}
          <div className="w-full">
            <Card className="border-border/50 shadow-lg rounded-2xl">
              <CardHeader className="space-y-4 pb-6">
                {/* Alert */}
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Something went wrong</AlertTitle>
                  <AlertDescription>
                    We couldn&apos;t load this part of your club dashboard.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">
                    Error occurred
                  </CardTitle>
                  <CardDescription className="text-base">
                    An unexpected error happened. Here&apos;s what you can try:
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Suggestions List */}
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Check your internet connection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Try again in a few seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Clear your browser cache and refresh</span>
                  </li>
                </ul>

                <Separator />

                {/* Primary Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" onClick={reset} className="flex-1">
                    Try again
                  </Button>
                  {isLoggedIn ? (
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="flex-1"
                    >
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Go to Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="flex-1"
                    >
                      <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Return Home
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Admin Contact Hint */}
                {isDashboardRoute && (
                  <>
                    <Separator />
                    <p className="text-xs text-center text-muted-foreground">
                      If this continues, contact your club admin.
                    </p>
                  </>
                )}

                {/* Error Details (Development only) */}
                {process.env.NODE_ENV === "development" && error.message && (
                  <>
                    <Separator />
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs font-mono text-muted-foreground break-all">
                        {error.message}
                      </p>
                      {error.digest && (
                        <p className="text-xs font-mono text-muted-foreground mt-2">
                          Digest: {error.digest}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
