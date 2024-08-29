"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { VendorsSelectResponse } from "@/actions/vendor-select";
import { MembersSelectResponse } from "@/actions/member-select";

const transactionMethods = ["CASH", "ACCOUNT", "UPI", "BANK", "CHEQUE"] as const;
const transactionTypes = ["PERIODIC_INVEST", "INVEST", "PERIODIC_RETURN", "RETURNS", "PROFIT"] as const;

// Zod schema definition
const formSchema = z.object({
    vendorId: z.string().min(1, { message: "Please select a vendor." }),
    memberId: z.string().min(1, { message: "Please select a member." }),
    transactionType: z.enum(transactionTypes, {
        required_error: "Please select a transaction type.",
        invalid_type_error: "Please select a transaction type."
    }),
    method: z.enum(transactionMethods, {
        required_error: "Please select a transaction method.",
        invalid_type_error: "Please select a transaction method."
    }),
    amount: z.preprocess((val) => Number(val), z.number().min(0.01, { message: "Amount must be greater than 0." })),
    note: z.string().optional(),
});

type VendorTransactionFormProps = {
    vendors: VendorsSelectResponse;
    members: MembersSelectResponse
};

export function VendorTransactionForm({ vendors, members }: VendorTransactionFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            vendorId: "",
            memberId: "",
            transactionType: "INVEST",
            method: "ACCOUNT",
            amount: 0,
            note: "",
        },
    });

    // Handle form submission
    async function onSubmit(data: z.infer<typeof formSchema>) {
        try {
            const response = await fetch('/api/vendor-transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(`Error: ${error.message || 'Failed to create transaction'}`);
                return;
            }

            const result = await response.json();
            toast.success('Transaction successfully added!');
            form.reset();  // Reset the form after successful submission
        } catch (error) {
            toast.error('An unexpected error occurred. Please try again.');
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-lg">
                {/* Vendor Selection */}
                <FormField
                    control={form.control}
                    name="vendorId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vendor</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendors.map((vendor) => (
                                            <SelectItem key={vendor.id} value={vendor.id}>
                                                {vendor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Member Selection */}
                <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Member</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {members.map((member) => (
                                            <SelectItem key={member.id} value={member.id}>
                                                {member.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Transaction Type Selection */}
                <FormField
                    control={form.control}
                    name="transactionType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Transaction Type</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select transaction type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {transactionTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Transaction Method Selection */}
                <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Transaction Method</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select transaction method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {transactionMethods.map((method) => (
                                            <SelectItem key={method} value={method}>
                                                {method}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Amount Input */}
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Enter amount" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Note Input */}
                <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Note</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Optional note" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Submit Button */}
                <Button type="submit" className="w-full">Add Transaction</Button>
            </form>
        </Form>
    );
}
