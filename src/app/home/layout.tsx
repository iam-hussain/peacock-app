import Box from "@/components/ui/box";


export default function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Box>{children}</Box>
    );
}
