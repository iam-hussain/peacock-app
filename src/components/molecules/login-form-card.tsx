"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import fetcher from "@/lib/fetcher";
import { fetchAccountSelect } from "@/lib/query-options";

const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormSchema = z.infer<typeof loginFormSchema>;

export function LoginFormCard() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data: accounts = [] } = useQuery(fetchAccountSelect());

  // Filter accounts to only show active members who can potentially login
  const loginableAccounts = useMemo(() => {
    return accounts
      .filter((acc) => acc.isMember && acc.active)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts]);

  const form = useForm<LoginFormSchema>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: LoginFormSchema) =>
      fetcher.post("/api/auth/login", { body: data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["authentication"] });
      await queryClient.refetchQueries({ queryKey: ["authentication"] });
      toast.success("Logged in successfully!");
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Invalid username and password.";
      const displayMessage =
        errorMessage.includes("Invalid") || errorMessage.includes("invalid")
          ? "Invalid username and password."
          : errorMessage;
      setError(displayMessage);
      toast.error(displayMessage);
    },
  });

  async function onSubmit(data: LoginFormSchema) {
    setError(null);
    return await mutation.mutateAsync(data);
  }

  return (
    <Card className="w-full max-w-[400px] border-border/50 bg-card shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-semibold">Login</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Access your club dashboard securely.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Username
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue placeholder="Select username" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Member Accounts */}
                        {loginableAccounts.length > 0 ? (
                          loginableAccounts.map((account) => {
                            // Use slug (username) as value, fallback to id if slug is missing
                            const username = account.slug || account.id;
                            return (
                              <SelectItem key={account.id} value={username}>
                                {account.name}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="" disabled>
                            No accounts available
                          </SelectItem>
                        )}
                        {/* Separator */}
                        {loginableAccounts.length > 0 && <SelectSeparator />}
                        {/* Super Admin Option */}
                        <SelectItem value="admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      className="h-11 rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Default password: Your 10-digit mobile number
                  </p>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground">
              Forgot password? Please contact the Admin to reset your password.
            </p>

            <Button
              type="submit"
              className="w-full h-11 rounded-lg"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
