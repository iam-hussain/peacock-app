"use client";

export const dynamic = "force-dynamic";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useDispatch } from "react-redux";
import { toast } from "sonner";

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
import fetcher from "@/lib/fetcher";
import { fetchAuthStatus } from "@/lib/query-options";
import { cn } from "@/lib/utils";
import { setIsLoggedIn } from "@/store/pageSlice";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { data: authData, isLoading: isAuthLoading } =
    useQuery(fetchAuthStatus());

  const isLoggedIn = authData?.isLoggedIn ?? false;
  const isMember = authData?.user?.kind === "member";
  const isAdminMember = authData?.user?.kind === "admin-member";
  const isSuperAdmin = authData?.user?.kind === "admin";

  // Fetch profile data for members and admin-members (not for super admin)
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

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => fetcher.post("/api/auth/logout"),
    onSuccess: async () => {
      dispatch(setIsLoggedIn(false));
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
      icon: <Shield className="h-6 w-6" />,
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
      description:
        "Contribute your monthly savings to the club fund. Build your financial future with consistent contributions.",
      color: "#E3F2FD",
    },
    {
      icon: <HandCoins className="h-8 w-8" />,
      title: "Borrow Based on Rules",
      description:
        "Access loans following our transparent club policies. Fair eligibility criteria for all members.",
      color: "#E8F5E9",
    },
    {
      icon: <LineChart className="h-8 w-8" />,
      title: "Track Everything",
      description:
        "Monitor your position and club performance in real-time. View balances, statements, and loan details anytime.",
      color: "#FFF3E0",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
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

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
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
          </div>
        </div>
      </nav>

      {/* Hero + Login Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 lg:py-24">
        <div
          className={cn(
            "grid grid-cols-1 gap-8 items-center max-w-6xl mx-auto",
            "lg:grid-cols-2 lg:gap-12"
          )}
        >
          {/* Left Column - Hero Content (Static - Always Visible) */}
          <div
            className={cn(
              "flex flex-col space-y-6",
              "text-center lg:text-left"
            )}
          >
            <div className={cn("flex", "justify-center lg:justify-start")}>
              <Image
                src="/peacock.svg"
                alt="Peacock Club"
                width={80}
                height={80}
                className="h-20 w-20 md:h-24 md:w-24"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Peacock Club
            </h1>
            <p className="text-lg font-medium text-muted-foreground md:text-xl">
              A transparent, community-managed savings and lending club.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Join a trusted financial community where members save together,
              borrow responsibly, and grow their wealth through transparent
              processes and fair policies.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-start">
              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href="/dashboard/terms-and-conditions">
                  View Terms & Conditions
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column - Login Card or User Card (Dynamic - Shows Skeleton When Loading) */}
          {isAuthLoading ? (
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[420px]">
                <Card className="border-border/50">
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
            </div>
          ) : !isLoggedIn ? (
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[420px]">
                <LoginFormCard />
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-full max-w-[420px]">
                <Card className="w-full border-border/50 bg-card shadow-sm">
                  <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-xl font-semibold">
                      Welcome back!
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {isSuperAdmin
                        ? "Super Admin"
                        : profileData?.account
                          ? `${profileData.account.firstName || ""} ${profileData.account.lastName || ""}`.trim() ||
                            profileData.account.username
                          : "Access your club dashboard and manage your account."}
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
                        Go to Dashboard
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
                    <div className="pt-2 space-y-2">
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
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {logoutMutation.isPending ? "Logging out..." : "Logout"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Reminder Band */}
      {!isLoggedIn && (
        <section className="border-y border-border/50 bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              Already a member? Scroll up to{" "}
              <span className="font-medium text-primary">login</span> and view
              your balances and loans in real time.
            </p>
          </div>
        </section>
      )}

      {/* Why Members Love Peacock Club Section */}
      <section id="overview" className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
          Why Members Love Peacock Club
        </h2>
        <p className="mb-12 text-center text-muted-foreground max-w-2xl mx-auto">
          Experience financial management built on trust, transparency, and
          community values.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border/50 bg-card shadow-sm transition-all hover:shadow-md"
            >
              <CardContent className="p-6">
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl relative"
                  style={{ backgroundColor: feature.color }}
                >
                  <div className="absolute inset-0 rounded-xl hidden dark:block bg-muted/60" />
                  <div className="relative z-10 text-foreground/70">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
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
        <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
          How It Works
        </h2>
        <p className="mb-12 text-center text-muted-foreground max-w-2xl mx-auto">
          Simple steps to start your financial journey with Peacock Club.
        </p>

        {/* Desktop: Horizontal Timeline */}
        <div className="hidden lg:flex items-start justify-center gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="relative w-full">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-8 left-[60%] right-0 h-0.5 bg-border" />
                )}

                {/* Step Content */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="absolute -inset-1 rounded-full bg-primary/20 blur" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <div className="text-primary">{step.icon}</div>
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile/Tablet: Vertical Stack */}
        <div className="flex flex-col gap-8 lg:hidden max-w-md mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <div className="text-primary">{step.icon}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="absolute top-12 left-1/2 h-full w-0.5 -translate-x-1/2 bg-border" />
                  )}
                </div>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © Peacock Club — Community Financial Group
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
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
          </div>
        </div>
      </footer>
    </div>
  );
}
