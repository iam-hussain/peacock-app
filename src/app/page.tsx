import Image from "next/image";

import Box from "@/components/ui/box";
import { CustomLink } from "@/components/ui/link";
import Typography from "@/components/ui/typography";

export default function Home() {
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
        <CustomLink href={"/dashboard"}>Join the club</CustomLink>
      </Box>
    </Box>
  );
}
