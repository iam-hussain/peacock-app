import MemberTransactionTable from "@/components/composition/members-transaction-table";
import { MemberTransactionForm } from "@/components/forms/member-transaction";
import Box from "@/components/ui/box";
import { CustomLink } from "@/components/ui/link";
import Typography from "@/components/ui/typography";
import Image from "next/image";

export default function Home() {
    return (
        <Box preset={'stack-center'} >
            <Box preset={'stack-center'}>
                <Typography variant={'brand'}>Peacock Club</Typography>

                <MemberTransactionForm members={[{ name: "test", id: "testId" }]} />
                <MemberTransactionTable />
            </Box>
        </Box>
    );
}
