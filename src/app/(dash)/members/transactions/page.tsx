
import { membersSelect } from "@/actions/member-select"
import MemberTransactionsAction from "@/components/templates/member-transactions-action"


export default async function Members() {
    const members = await membersSelect()

    return (
        <MemberTransactionsAction members={members} />
    )
}
