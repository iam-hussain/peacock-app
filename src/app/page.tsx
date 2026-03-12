"use client";

export const dynamic = "force-dynamic";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Eye,
  HandCoins,
  LayoutDashboard,
  LineChart,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
  Users,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

import {
  setIsLoggedIn,
  useAppState,
} from "@/components/providers/app-state-provider";
import { LoginFormCard } from "@/components/molecules/login-form-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import fetcher from "@/lib/core/fetcher";
import { fetchAuthStatus } from "@/lib/query-options";
import { cn } from "@/lib/ui/utils";

const luxuryEase = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  const { theme, setTheme } = useTheme();
  const { dispatch } = useAppState();
  const queryClient = useQueryClient();
  const [showLogin, setShowLogin] = useState(false);
  const { data: authData, isLoading: isAuthLoading } =
    useQuery(fetchAuthStatus());

  const isLoggedIn = authData?.isLoggedIn ?? false;
  const isMember = authData?.user?.kind === "member";
  const isAdminMember = authData?.user?.kind === "admin-member";
  const isSuperAdmin = authData?.user?.kind === "admin";

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      fetcher.get("/api/profile") as Promise<{
        account: {
          firstName: string | null;
          lastName: string | null;
          username: string;
        };
      }>,
    enabled: (isMember || isAdminMember) && isLoggedIn,
  });

  const logoutMutation = useMutation({
    mutationFn: () => fetcher.post("/api/auth/logout"),
    onSuccess: async () => {
      dispatch(setIsLoggedIn(false));
      queryClient.setQueryData(["authentication"], {
        isLoggedIn: false,
        user: null,
      });
      queryClient.removeQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["authentication"] });
      await queryClient.refetchQueries({ queryKey: ["authentication"] });
      toast.success("Logged out successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const features = [
    {
      icon: <Eye className="h-5 w-5" />,
      title: "Transparent Tracking",
      description: "Every transaction recorded and visible to all members.",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Automated Calculations",
      description: "Smart algorithms handle interest, returns, and balances.",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Member-Owned",
      description: "Community-driven financial management, by members.",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Full Visibility",
      description: "Complete transparency into club finances and positions.",
    },
  ];

  const steps = [
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Deposit Monthly",
      description:
        "Contribute your monthly savings to the club fund.",
    },
    {
      icon: <HandCoins className="h-6 w-6" />,
      title: "Borrow Based on Rules",
      description:
        "Access loans following transparent club policies.",
    },
    {
      icon: <LineChart className="h-6 w-6" />,
      title: "Track Everything",
      description:
        "Monitor your position and club performance in real-time.",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-accent/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-background/60 glass-surface">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/peacock.svg"
              alt="Peacock Club"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-sm font-brand font-bold text-foreground tracking-[0.15em] uppercase">
              Peacock Club
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="gold-line" />
      </nav>

      {/* Hero Section — The Facade */}
      <section className="relative z-10 container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {!showLogin && !isLoggedIn && !isAuthLoading ? (
              <motion.div
                key="hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
                transition={{ duration: 0.6, ease: luxuryEase }}
                className="flex flex-col items-center text-center"
              >
                {/* Breathing Peacock Mark */}
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-8"
                >
                  <Image
                    src="/peacock.svg"
                    alt="Peacock Club"
                    width={100}
                    height={100}
                    className="h-24 w-24 md:h-28 md:w-28"
                  />
                </motion.div>

                {/* Display Title */}
                <motion.h1
                  className="font-brand text-4xl md:text-6xl lg:text-7xl tracking-[0.08em] text-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8, ease: luxuryEase }}
                >
                  THE PEACOCK CLUB
                </motion.h1>

                {/* Gold divider */}
                <motion.div
                  className="gold-line w-24 my-6"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: luxuryEase }}
                />

                {/* Subtitle */}
                <motion.p
                  className="text-muted-foreground text-base md:text-lg tracking-wide max-w-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  A private financial society for those who were invited.
                </motion.p>

                {/* Enter Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="mt-10"
                >
                  <Button
                    variant="luxury"
                    size="lg"
                    onClick={() => setShowLogin(true)}
                    className="px-12 py-3 text-sm"
                  >
                    Enter
                  </Button>
                </motion.div>

                {/* Member count */}
                <motion.p
                  className="mt-12 text-xs text-muted-foreground/60 tracking-[0.2em] uppercase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                >
                  Since 2020
                </motion.p>
              </motion.div>
            ) : showLogin && !isLoggedIn && !isAuthLoading ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: luxuryEase }}
                className="flex flex-col items-center"
              >
                {/* Back button */}
                <motion.button
                  onClick={() => setShowLogin(false)}
                  className="mb-8 text-xs text-muted-foreground hover:text-foreground tracking-[0.15em] uppercase transition-colors duration-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  &larr; Back
                </motion.button>

                <div className="w-full max-w-[420px]">
                  <LoginFormCard />
                </div>
              </motion.div>
            ) : isAuthLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="w-full max-w-[420px]">
                  <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-6 space-y-4">
                      <Skeleton className="h-7 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <div className="space-y-3 pt-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="authenticated"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: luxuryEase }}
                className="flex flex-col items-center"
              >
                <div className="w-full max-w-[420px]">
                  <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1 pb-4 text-center">
                      <div className="flex justify-center mb-2">
                        <Image
                          src="/peacock.svg"
                          alt="Peacock Club"
                          width={48}
                          height={48}
                        />
                      </div>
                      <CardTitle className="text-xl font-brand tracking-wide">
                        Welcome back
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {isSuperAdmin
                          ? "Super Admin"
                          : profileData?.account
                            ? `${profileData.account.firstName || ""} ${profileData.account.lastName || ""}`.trim() ||
                              profileData.account.username
                            : "Access your club dashboard"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        size="lg"
                        asChild
                        className="w-full h-11 rounded-lg"
                      >
                        <Link href="/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Enter the Club
                        </Link>
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          size="lg"
                          asChild
                          className="h-11 rounded-lg"
                        >
                          <Link href="/dashboard/profile">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          asChild
                          className="h-11 rounded-lg"
                        >
                          <Link href="/dashboard/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </Button>
                      </div>
                      <div className="gold-line my-3" />
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="w-full text-muted-foreground hover:text-foreground"
                        >
                          <Link href="/dashboard/transaction">
                            <Wallet className="mr-2 h-4 w-4" />
                            View Transactions
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleLogout}
                          disabled={logoutMutation.isPending}
                          className="w-full text-muted-foreground hover:text-destructive"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {logoutMutation.isPending
                            ? "Logging out..."
                            : "Logout"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Feature Cards — Atmospheric Section */}
      {!isLoggedIn && (
        <section className="relative z-10 container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="font-brand text-2xl md:text-3xl tracking-wide text-foreground mb-3">
              Why Members Stay
            </h2>
            <div className="gold-line w-16 mx-auto" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: luxuryEase }}
              >
                <Card className="border-border/20 bg-card/50 backdrop-blur-sm shadow-none hover:border-primary/10 transition-all duration-500 h-full">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-sm font-semibold text-foreground tracking-wide">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      {!isLoggedIn && (
        <section className="relative z-10 container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="font-brand text-2xl md:text-3xl tracking-wide text-foreground mb-3">
              How It Works
            </h2>
            <div className="gold-line w-16 mx-auto" />
          </div>

          {/* Desktop: Horizontal */}
          <div className="hidden lg:flex items-start justify-center gap-12 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5, ease: luxuryEase }}
                className="flex-1 flex flex-col items-center text-center"
              >
                <div className="relative mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <div className="text-primary">{step.icon}</div>
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground tracking-wide">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Mobile: Vertical */}
          <div className="flex flex-col gap-8 lg:hidden max-w-sm mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: luxuryEase }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                    <span className="absolute flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground -mt-8 -mr-6">
                      {index + 1}
                    </span>
                    <div className="text-primary">{step.icon}</div>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="mb-1 text-sm font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Footer — The Inscription */}
      <footer className="relative z-10 py-12">
        <div className="gold-line max-w-xs mx-auto mb-8" />
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground/50 tracking-[0.2em] uppercase mb-2">
            Membership is by introduction only
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/40 mt-4">
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors duration-300"
            >
              Dashboard
            </Link>
            <span className="text-primary/20">&middot;</span>
            <Link
              href="/dashboard/terms-and-conditions"
              className="hover:text-foreground transition-colors duration-300"
            >
              Terms & Conditions
            </Link>
          </div>
          <p className="mt-6 text-[10px] text-muted-foreground/30 tracking-wider">
            &copy; Peacock Club &mdash; Since 2020
          </p>
        </div>
      </footer>
    </div>
  );
}
