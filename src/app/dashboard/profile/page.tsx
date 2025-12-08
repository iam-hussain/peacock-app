"use client";

export const dynamic = "force-dynamic";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Info, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import fetcher from "@/lib/fetcher";
import { cn } from "@/lib/utils";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  slug: z
    .string()
    .min(1, "Username is required")
    .regex(
      /^[a-z0-9_-]+$/,
      "Username can only contain lowercase letters, numbers, hyphens, and underscores"
    )
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters"),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const { user } = useAuth();

  // Detect if user is super-admin
  const isSuperAdmin = user?.kind === "admin";

  // Fetch profile data (will return virtual profile for super-admin)
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetcher.get("/api/profile"),
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      slug: "",
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profileData?.account) {
      profileForm.reset({
        firstName: profileData.account.firstName || "",
        lastName: profileData.account.lastName || "",
        email: profileData.account.email || "",
        slug: profileData.account.slug || profileData.account.username || "",
      });
    }
  }, [profileData, profileForm]);

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) =>
      fetcher.patch("/api/profile", { body: data }),
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.message || "Failed to update profile. Please try again."
      );
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormValues) =>
      fetcher.patch("/api/profile/password", {
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      }),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPasswordDialogOpen(false);
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast.error(
        error.message || "Failed to change password. Please try again."
      );
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    profileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    passwordMutation.mutate(data);
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
        {/* Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-foreground">Profile</span>
        </div>

        {/* Header Section */}
        <div className="text-center space-y-4 py-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <User className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              My Profile
            </h1>
            <p className="mt-2 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Update your personal information and manage your account
            </p>
          </div>
        </div>

        {/* Profile Information Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={profileForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="username"
                          className={cn(
                            "font-mono",
                            isSuperAdmin &&
                              "bg-muted cursor-not-allowed text-muted-foreground"
                          )}
                          disabled={isSuperAdmin}
                          readOnly={isSuperAdmin}
                          tabIndex={isSuperAdmin ? -1 : 0}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Used for login. Lowercase letters, numbers, hyphens, and
                        underscores only.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            className={cn(
                              isSuperAdmin &&
                                "bg-muted cursor-not-allowed text-muted-foreground"
                            )}
                            disabled={isSuperAdmin}
                            readOnly={isSuperAdmin}
                            tabIndex={isSuperAdmin ? -1 : 0}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            className={cn(
                              isSuperAdmin &&
                                "bg-muted cursor-not-allowed text-muted-foreground"
                            )}
                            disabled={isSuperAdmin}
                            readOnly={isSuperAdmin}
                            tabIndex={isSuperAdmin ? -1 : 0}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@example.com"
                          className={cn(
                            isSuperAdmin &&
                              "bg-muted cursor-not-allowed text-muted-foreground"
                          )}
                          disabled={isSuperAdmin}
                          readOnly={isSuperAdmin}
                          tabIndex={isSuperAdmin ? -1 : 0}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  {isSuperAdmin ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border">
                      <span className="text-sm font-medium text-muted-foreground">
                        Super Admin profile (managed via environment)
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            This account is configured via environment variables
                            and cannot be edited from the dashboard.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      disabled={profileMutation.isPending}
                      className="gap-2"
                    >
                      {profileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Password Management Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              {isSuperAdmin
                ? "Super Admin password is managed securely outside this dashboard."
                : "Change your password to keep your account secure"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuperAdmin ? (
              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Super Admin password is managed securely outside this
                  dashboard.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Password Management
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Update your password regularly to maintain account security
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  Change Password
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and choose a new one
              </DialogDescription>
            </DialogHeader>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter current password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPasswordDialogOpen(false);
                      passwordForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending
                      ? "Changing..."
                      : "Change Password"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
