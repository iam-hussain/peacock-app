import Box from "@/components/ui/box"
import Typography from "@/components/ui/typography"
import { VendorTransactionDrawer } from "@/components/composition/vendor-transaction-drawer"
import VendorTransactionsTable from "@/components/composition/vendor-transaction-table"
import { membersSelect } from "@/actions/member-select"
import { vendorsSelect } from "@/actions/vendor-select"


export default async function Members() {
    const members = await membersSelect()
    const vendors = await vendorsSelect()

    return (
        <Box preset={'stack-start'} >
            <Box preset={'row-between'} className="px-4 md:px-6">
                <Typography variant={'h3'} className="">Vendor Transactions</Typography>
                <VendorTransactionDrawer members={members} vendors={vendors} />
            </Box>
            <Box className="bg-background p-4 md:p-6 rounded-md width-avl">
                <VendorTransactionsTable />
            </Box>
        </Box>
    )
}
