import Box from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/link";
import Typography from "@/components/ui/typography";


export default function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Box preset={'stack-start'} className="min-h-screen w-full bg-paper">
            <Box preset={'row-between'} className="h-auto px-8 p-4 w-full bg-background border-b">
                <CustomLink href="/home" variant={'transparent'} className="p-0 px-2">
                    <Typography variant={'brandMini'} className="w-full">Peacock Club</Typography>
                </CustomLink>
                <Box preset={"row-start"} className="w-auto">
                    <CustomLink href="/members" variant={'accent'}>
                        Members
                    </CustomLink>
                    <CustomLink href="/vendors" variant={'accent'}>
                        Vendors
                    </CustomLink>
                </Box>
            </Box>
            <Box className="max-w-screen-2xl m-auto py-4 pb-16">
                {children}
            </Box>
        </Box>
    );
}
