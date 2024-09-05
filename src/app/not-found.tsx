import { ThemeModeToggle } from "@/components/molecules/theme-mode-toggle";
import Box from "@/components/ui/box";
import { CustomLink } from "@/components/ui/link";
import Typography from "@/components/ui/typography";

export default function NonFound() {
  return (
    <Box preset={"stack-center"} className="w-full min-h-svh bg-background">
      <div className="absolute right-4 top-4">
        <ThemeModeToggle />
      </div>
      <Box preset={"stack-center"}>
        <Typography variant={"brandMedium"}>Peacock Club</Typography>
        <Box
          preset={"stack-center"}
          className="p-6 border rounded-md w-auto gap-0"
        >
          <p className="text-8xl font-brand">404</p>
          <p className="text-2xl">Page not found!</p>
        </Box>{" "}
        <CustomLink href={"/"}>Return Home</CustomLink>
      </Box>
    </Box>
  );
}
