import MembersTable from "@/components/composition/members-table"
import Box from "@/components/ui/box"
import Typography from "@/components/ui/typography"
import { Separator } from "@/components/ui/separator"
import { membersTable } from "@/actions/member"
import { CustomLink } from "@/components/ui/link"


export default async function Members() {

    return (
        <Box preset={'stack-start'} >
            <Box preset={'row-start'} className="px-4 md:px-6">
                <Typography variant={'h3'} className="">Members</Typography>
                <CustomLink href="/members/transaction" variant={'default'}>
                    Members Transaction
                </CustomLink>
            </Box>
            <Box className="bg-background p-4 md:p-6 rounded-md width-avl h-full">
                <MembersTable />
            </Box>
        </Box>
    )
}
