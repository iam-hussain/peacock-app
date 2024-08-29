import Box from "@/components/ui/box"
import Typography from "@/components/ui/typography"
import { CustomLink } from "@/components/ui/link"
import VendorTable from "@/components/composition/vendor-table"
import { getVendors } from "@/actions/vendors"


export default async function Vendors() {
    const vendors = await getVendors()
    return (
        <Box preset={'stack-start'} >
            <Box preset={'row-between'} className="px-4 md:px-6">
                <Typography variant={'h3'} className="">Vendors</Typography>
                <CustomLink href="/vendors/transactions" variant={'default'}>
                    Vendor Transactions
                </CustomLink>
            </Box>
            <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
                <VendorTable vendors={vendors} />
            </Box>
        </Box>
    )
}
