import MemberTransactionTable from "@/components/composition/members-transaction-table";
import Box from "@/components/ui/box";
import { CustomLink } from "@/components/ui/link";
import Typography from "@/components/ui/typography";
import Image from "next/image";

export default function Home() {
    return (
        <Box preset={'stack-center'} >
            <Box preset={'stack-center'}>
                <Typography variant={'brand'}>Peacock Club</Typography>
                <MemberTransactionTable transactions={[]} />
            </Box>
        </Box>
    );
}
