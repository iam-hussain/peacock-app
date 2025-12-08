"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, Home, Receipt, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ThemeModeToggle } from "@/components/molecules/theme-mode-toggle";
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

export default function NotFound() {
  const { data: authData } = useQuery(fetchAuthStatus());
  const isLoggedIn = authData?.isLoggedIn ?? false;

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
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-3xl blur-3xl" />

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
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="flex justify-center">
                  <div className="rounded-full bg-muted p-4">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold">
                    Page not found
                  </CardTitle>
                  <CardDescription className="text-base">
                    The page you&apos;re looking for doesn&apos;t exist or has
                    moved.
                  </CardDescription>
                </div>
                <p className="text-sm text-muted-foreground">
                  If you believe this is a mistake, contact your club admin.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Error Code */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-mono">
                    Error code: 404
                  </p>
                </div>

                <Separator />

                {/* Primary Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {isLoggedIn ? (
                    <Button size="lg" asChild className="flex-1">
                      <Link href="/dashboard">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button size="lg" asChild className="flex-1">
                      <Link href="/">
                        Return Home
                        <Home className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}

                  {isLoggedIn && (
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="flex-1"
                    >
                      <Link href="/dashboard/transaction">
                        <Receipt className="mr-2 h-4 w-4" />
                        View Transactions
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Secondary Actions */}
                {isLoggedIn && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="ghost"
                      size="lg"
                      asChild
                      className="flex-1"
                    >
                      <Link href="/dashboard/member">
                        <Users className="mr-2 h-4 w-4" />
                        Members Overview
                      </Link>
                    </Button>
                  </div>
                )}

                <Separator />

                {/* Mini Navigation */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Link
                    href="/"
                    className="hover:text-foreground transition-colors"
                  >
                    Home
                  </Link>
                  <span>·</span>
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="hover:text-foreground transition-colors"
                      >
                        Dashboard
                      </Link>
                      <span>·</span>
                    </>
                  ) : null}
                  <Link
                    href="/dashboard/terms-and-conditions"
                    className="hover:text-foreground transition-colors"
                  >
                    Help
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
