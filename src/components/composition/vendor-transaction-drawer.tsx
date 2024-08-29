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
import { VendorTransactionForm } from "../forms/vendor-transaction"
import { VendorsSelectResponse } from "@/actions/vendor-select"
import { MembersSelectResponse } from "@/actions/member-select"


export function VendorTransactionDrawer({ vendors, members }: { vendors: VendorsSelectResponse, members: MembersSelectResponse }) {

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button variant="outline">Add Transaction</Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm mb-6">
                    <DrawerHeader>
                        <DrawerTitle>Add Vendor Transaction</DrawerTitle>
                        {/* <DrawerDescription></DrawerDescription> */}
                    </DrawerHeader>
                    <VendorTransactionForm vendors={vendors} members={members} />
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full my-2">Cancel</Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
