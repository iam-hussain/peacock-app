"use client";

import { useEffect } from "react";
import { Button } from "react-day-picker";

import { ThemeModeToggle } from "@/components/molecules/theme-mode-toggle";
import Box from "@/components/ui/box";
import Typography from "@/components/ui/typography";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <Box preset={"stack-center"} className="w-full min-h-svh bg-background">
      <div className="absolute right-4 top-4">
        <ThemeModeToggle />
      </div>
      <Box preset={"stack-center"}>
        <Typography variant={"brandMedium"}>Peacock Club</Typography>

        <p className="text-2xl">Something went wrong!</p>

        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try again
        </Button>
      </Box>
    </Box>
  );
}
