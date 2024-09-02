import { membersSelect } from "@/actions/member-select"
import { vendorsSelect } from "@/actions/vendor-select"
import VendorTransactionsAction from "@/components/templates/vendor-transactions-action"


export default async function Members() {
    const members = await membersSelect()
    const vendors = await vendorsSelect()

    return (
        <VendorTransactionsAction members={members} vendors={vendors} />
    )
}
