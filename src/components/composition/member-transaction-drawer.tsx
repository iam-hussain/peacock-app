import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { MemberTransactionForm } from "../forms/member-transaction"
import { MembersSelectResponse } from "@/actions/member-select"


export function MemberTransactionDrawer({ members }: { members: MembersSelectResponse }) {

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button variant="outline">Add Transaction</Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm mb-6">
                    <DrawerHeader>
                        <DrawerTitle>Add Member Transaction</DrawerTitle>
                        {/* <DrawerDescription></DrawerDescription> */}
                    </DrawerHeader>
                    <MemberTransactionForm members={members} />
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full my-2">Cancel</Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
