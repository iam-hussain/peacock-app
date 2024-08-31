import Box from "@/components/ui/box"
import Typography from "@/components/ui/typography"
import { CustomLink } from "@/components/ui/link"
import VendorTable from "@/components/composition/vendor-table"
import { getVendors } from "@/actions/vendors"
import { membersSelect } from "@/actions/member-select"
import VendorAction from "@/components/vendor-action"


export default async function Vendors() {
    const vendors = await getVendors()
    const members = await membersSelect()

    return (
        <Box preset={'stack-start'} >
            <Box preset={'row-between'} className="px-4 md:px-6">
                <Typography variant={'h3'} className="">Vendors</Typography>
                <CustomLink href="/vendors/transactions" variant={'default'}>
                    Vendor Transactions
                </CustomLink>
            </Box>
            <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
                <VendorAction members={members} vendors={vendors} />
            </Box>
        </Box>
    )
}
