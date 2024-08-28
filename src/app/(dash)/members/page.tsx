import MembersTable from "@/components/composition/member-table"
import Box from "@/components/ui/box"
import Typography from "@/components/ui/typography"
import { CustomLink } from "@/components/ui/link"


export default async function Members() {

    return (
        <Box preset={'stack-start'} >
            <Box preset={'row-between'} className="px-4 md:px-6">
                <Typography variant={'h3'} className="">Members</Typography>
                <CustomLink href="/members/transactions" variant={'default'}>
                    Member Transactions
                </CustomLink>
            </Box>
            <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
                <MembersTable />
            </Box>
        </Box>
    )
}
