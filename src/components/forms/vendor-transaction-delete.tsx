"use client";
import { toast } from "sonner";
import { GenericModalFooter } from "../generic-modal";
import { VendorTransactionResponse } from "@/app/api/vendor-transactions/route";


type VendorTransactionDeleteFormProps = {
    transaction: VendorTransactionResponse
    onSuccess: () => void
    onCancel?: () => void
}

export function VendorTransactionDeleteForm({ transaction, onSuccess, onCancel }: VendorTransactionDeleteFormProps) {

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/vendor-transactions/${transaction.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(`Error: ${error.message || "Failed to delete vendor transaction"}`);
                return;
            }

            const result = await response.json();
            toast.success("Vendor transaction deleted successfully");
            if (onSuccess) {
                onSuccess()
            }
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
        }
    };

    return (
        <div>
            <div className="py-4 flex justify-center align-middle items-center flex-col">
                <p className="py-4 px-2">Are you sure you want to delete vendor transactions, This action cannot be undone.</p>

                <div className="">
                    <p><span className="text-foreground/80">Vendor: </span>{transaction.vendor.name}</p>
                    <p><span className="text-foreground/80">Member:  </span>{transaction.member.name}</p>
                    <p><span className="text-foreground/80">Amount:  </span>{transaction.amount}</p>
                </div>
            </div>
            <GenericModalFooter isDelete={true} actionLabel={"Delete"} onCancel={onCancel} onConfirm={handleDelete} />
        </div>
    );
}
