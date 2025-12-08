"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  HandCoins,
  LineChart,
  Moon,
  Sun,
  Users,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { LoginFormCard } from "@/components/molecules/login-form-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchAuthStatus } from "@/lib/query-options";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const { data: authData } = useQuery(fetchAuthStatus());
  const { data: statsData } = useQuery(fetchStatistics());
  const [mounted, setMounted] = useState(false);

  const isLoggedIn = authData?.isLoggedIn ?? false;
  const statistics = statsData?.statistics;
  const club = clubAge();

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Transparent Tracking",
      description: "Every transaction is recorded and visible to all members.",
      color: "#E3F2FD",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Automated Calculations",
      description: "Smart algorithms handle interest, returns, and balances.",
      color: "#E8F5E9",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Member-Owned",
      description:
        "Community-driven financial management for members, by members.",
      color: "#FFF3E0",
    },
    {
      icon: <CheckCircle2 className="h-6 w-6" />,
      title: "Full Visibility",
      description:
        "Complete transparency into club finances and member positions.",
      color: "#F3E5F5",
    },
  ];

  const steps = [
    {
      icon: <Wallet className="h-8 w-8" />,
      title: "Deposit Monthly",
      description: "Contribute your monthly savings to the club fund.",
      color: "#E3F2FD",
    },
    {
      icon: <HandCoins className="h-8 w-8" />,
      title: "Borrow Based on Rules",
      description: "Access loans following our transparent club policies.",
      color: "#E8F5E9",
    },
    {
      icon: <LineChart className="h-8 w-8" />,
      title: "Track Everything",
      description: "Monitor your position and club performance in real-time.",
      color: "#FFF3E0",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/peacock.svg"
              alt="Peacock Club"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-lg font-semibold text-foreground">
              Peacock Club
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="#overview"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Overview
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            {/* Auth Buttons */}
            {isLoggedIn ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/profile">Profile</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto flex flex-col items-center justify-center px-4 py-20 md:py-32">
        <div className="mb-8 flex items-center justify-center">
          <Image
            src="/peacock.svg"
            alt="Peacock Club"
            width={120}
            height={120}
            className="h-24 w-24 md:h-32 md:w-32"
          />
        </div>
        <h1 className="mb-4 text-center text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Peacock Club
        </h1>
        <p className="mb-8 max-w-2xl text-center text-lg text-muted-foreground md:text-xl">
          A transparent, community-managed savings and lending club.
        </p>

        {/* Login Form - Show when not logged in */}
        {!isLoggedIn && (
          <div className="mb-8 w-full flex justify-center px-4">
            <div className="w-full max-w-[400px]">
              <LoginFormCard />
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/dashboard">
              Join the Club
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Link
          href="/dashboard/terms-and-conditions"
          className="mt-6 text-sm text-primary hover:underline"
        >
          View Terms & Conditions
        </Link>
      </section>

      {/* Why Join Us Section */}
      <section id="overview" className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">
          Why Join Us
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border/50 bg-card shadow-sm transition-all hover:shadow-md"
            >
              <CardContent className="p-6">
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full relative"
                  style={{ backgroundColor: feature.color }}
                >
                  <div className="absolute inset-0 rounded-full hidden dark:block bg-muted/60" />
                  <div className="relative z-10 text-foreground/70">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="container mx-auto px-4 py-16 md:py-24"
      >
        <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">
          How It Works
        </h2>
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center md:max-w-xs"
            >
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full relative"
                style={{ backgroundColor: step.color }}
              >
                <div className="absolute inset-0 rounded-full hidden dark:block bg-muted/60" />
                <div className="relative z-10 text-foreground/70">
                  {step.icon}
                </div>
              </div>
              <div className="mb-2 text-2xl font-bold text-muted-foreground">
                {index + 1}
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
              {index < steps.length - 1 && (
                <ArrowRight className="mt-4 hidden h-6 w-6 rotate-90 text-muted-foreground md:block md:rotate-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground md:justify-start">
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <span>•</span>
              <Link
                href="/dashboard"
                className="hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <span>•</span>
              <Link
                href="/dashboard/terms-and-conditions"
                className="hover:text-foreground transition-colors"
              >
                Terms & Conditions
              </Link>
              <span>•</span>
              <Link
                href="#privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © Peacock Club — Community Financial Group
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
