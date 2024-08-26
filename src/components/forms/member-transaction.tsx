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
import { memberTransactionTypeMap, transactionMethodMap } from "@/lib/config";
import { MembersSelectResponse } from "@/actions/member";

// Transaction method and type enums
const transactionMethods = ["CASH", "ACCOUNT", "UPI", "BANK", "CHEQUE"] as const;
const transactionTypes = ["PERIODIC_DEPOSIT", "OFFSET_DEPOSIT", "WITHDRAW", "REJOIN", "FUNDS_TRANSFER"] as const;

// Zod schema definition
const formSchema = z.object({
    fromId: z.string().min(1, { message: "Please select a 'from' member." }),
    toId: z.string().min(1, { message: "Please select a 'to' member." }),
    transactionType: z.enum(transactionTypes, {
        required_error: "Please select a transaction type.",
        invalid_type_error: "Please select a transaction type."
    }),
    method: z.enum(transactionMethods, {
        required_error: "Please select a transaction method.",
        invalid_type_error: "Please select a transaction method."
    }),
    amount: z.preprocess((val) => Number(val), z.number().min(1, { message: "Amount must be greater than 0." })),
    note: z.string().optional(),
});

type MemberTransactionFormProps = {
    members: MembersSelectResponse
}

export function MemberTransactionForm({ members }: MemberTransactionFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fromId: "",
            toId: "",
            transactionType: "FUNDS_TRANSFER",
            method: "ACCOUNT",
            amount: 0,
            note: "",
        },
    });

    // Handle form submission
    async function onSubmit(data: z.infer<typeof formSchema>) {
        try {
            const response = await fetch('/api/member-transactions', {
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
                <FormField
                    control={form.control}
                    name="fromId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>From</FormLabel>
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

                <FormField
                    control={form.control}
                    name="toId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>To</FormLabel>
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
                                        {Object.entries(memberTransactionTypeMap).map(([key, name]) => (
                                            <SelectItem key={key} value={key}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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
                                        {Object.entries(transactionMethodMap).map(([key, name]) => (
                                            <SelectItem key={key} value={key}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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

                <Button type="submit" className="w-full">Add</Button>
            </form>
        </Form>
    );
}
