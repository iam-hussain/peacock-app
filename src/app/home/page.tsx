import Box from "@/components/ui/box";
import { CustomLink } from "@/components/ui/link";
import Typography from "@/components/ui/typography";
import Image from "next/image";

export default function Home() {
    return (
        <Box preset={'stack-center'} className="min-h-screen w-full">
            <Box>
                <Image src={'/peacock.jpg'} alt={"Peacock Club"} width={200} height={200} />
            </Box>
            <Box preset={'stack-center'}>
                <Typography variant={'brand'}>Peacock Club</Typography>
                <CustomLink href={'/home'}>Go to dashboard</CustomLink>
            </Box>
        </Box>
    );
}
