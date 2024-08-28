import Box from "@/components/ui/box"
import Typography from "@/components/ui/typography"
import MemberTransactionTable from "@/components/composition/member-transaction-table"
import { MemberTransactionDrawer } from "@/components/composition/member-transaction-drawer"
import { membersSelect } from "@/actions/member"


export default async function Members() {
    const members = await membersSelect()

    return (
        <Box preset={'stack-start'} >
            <Box preset={'row-between'} className="px-4 md:px-6">
                <Typography variant={'h3'} className="">Member Transactions</Typography>
                <MemberTransactionDrawer members={members} />
            </Box>
            <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
                <MemberTransactionTable />
            </Box>
        </Box>
    )
}
