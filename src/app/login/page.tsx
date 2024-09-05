"use client";
import Box from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Typography from "@/components/ui/typography";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CustomLink } from "@/components/ui/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import fetcher from "@/lib/fetcher";

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => fetcher.post("/api/vendor", { body: { password } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["auth"],
      });
      toast.success("Logged in successfully!");
      router.push("/dashboard"); // Redirect to the dashboard or any protected route
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    return await mutation.mutateAsync();
  }

  return (
    <Box preset={"stack-center"} className="w-full min-h-svh bg-background">
      <Box>
        <Image
          src={"/peacock.jpg"}
          alt={"Peacock Club"}
          width={200}
          height={200}
        />
      </Box>
      <Box preset={"stack-center"}>
        <Typography variant={"brand"}>Peacock Club</Typography>

        <div className="py-6">
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
        <div>
          <CustomLink href={"/dashboard"} variant={"outline"}>
            Back to club
          </CustomLink>
        </div>
      </Box>
    </Box>
  );
}
