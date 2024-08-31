'use client'
import Box from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Typography from "@/components/ui/typography";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from 'next/navigation'
import { CustomLink } from "@/components/ui/link";



export default function Login() {
  const router = useRouter()

  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      toast.success("Logged in successfully!");
      router.push("/home"); // Redirect to the dashboard or any protected route
    } else {
      const { error } = await res.json();
      toast.error(error || "Failed to log in");
    }
  };


  return (
    <Box preset={'stack-center'} className="w-full min-h-svh bg-background">
      <Box>
        <Image src={'/peacock.jpg'} alt={"Peacock Club"} width={200} height={200} />
      </Box>
      <Box preset={'stack-center'}>
        <Typography variant={'brand'}>Peacock Club</Typography>

        <div className="py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">Login</Button>
          </form>


        </div>
        <div>
          <CustomLink href={'/home'} variant={'outline'}>Back to club</CustomLink>
        </div>

      </Box>
    </Box>
  );
}
