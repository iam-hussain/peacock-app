import Box from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import Typography from "@/components/ui/typography";


export default function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Box preset={'stack-start'} className="min-h-screen w-full flex-col md:flex-col-reverse"> <Box className="grow p-4 pb-12 w-full" preset={'stack-responsive'}><Typography variant={'brandMini'} className="md:hidden" >Peacock Club</Typography>{children}</Box> <Box className="w-full p-2 md:px-6 md:border-b-2 md:border-t-0 border-t-2 bg-secondary md:justify-between">
            <Typography variant={'brandMini'} className="w-full hidden md:flex">Peacock Club</Typography>
            <Box className="md:w-auto gap-2">
                <Button variant={'link'}>Home</Button>
                <Button variant={'link'}>Members</Button>
                <Button variant={'link'}>Vendors</Button>
                <Button variant={'link'} className="hidden md:flex">Transaction</Button>
            </Box>
        </Box></Box>
    );
}
