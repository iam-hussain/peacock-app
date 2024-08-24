import MembersTable from "@/components/composition/members-table"
import Box from "@/components/ui/box"
import Typography from "@/components/ui/typography"
import { Separator } from "@/components/ui/separator"
import { membersTable } from "@/actions/member"


export default async function Members() {

    return (
        <Box preset={'stack-start'} className="md:w-auto">
            <Box preset={'stack-start'} className="gap-1">
                <Typography variant={'h4'}>Members</Typography>
                <Separator />
            </Box>
            <MembersTable />
        </Box>
    )
}
