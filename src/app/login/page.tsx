"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ThemeModeToggle } from "@/components/molecules/theme-mode-toggle";
import Box from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomLink } from "@/components/ui/link";
import Typography from "@/components/ui/typography";
import fetcher from "@/lib/fetcher";

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => fetcher.post("/api/auth/login", { body: { password } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["authentication"],
      });
      toast.success("Logged in successfully!");
      router.push("/dashboard"); // Redirect to the dashboard or any protected route
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    return await mutation.mutateAsync();
  }

  return (
    <Box preset={"stack-center"} className="w-full min-h-svh bg-background">
      <div className="absolute right-4 top-4">
        <ThemeModeToggle />
      </div>
      <Box>
        <Image
          src={"/peacock.svg"}
          alt={"Peacock Club"}
          width={200}
          height={200}
        />
      </Box>
      <Box preset={"stack-center"}>
        <Typography variant={"brand"}>Peacock Club</Typography>

        <div className="py-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              Login
            </Button>
          </form>
        </div>

        <CustomLink href={"/dashboard"}>Back to club</CustomLink>
      </Box>
    </Box>
  );
}
