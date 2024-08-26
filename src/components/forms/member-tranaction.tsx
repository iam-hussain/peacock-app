"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const transactionMethods = ["CASH", "ACCOUNT", "UPI", "BANK", "CHEQUE"] as const;
const transactionTypes = ["PERIODIC_DEPOSIT", "OFFSET_DEPOSIT", "WITHDRAW", "REJOIN", "FUNDS_TRANSFER"] as const;
const formSchema = z.object({
    formId: z.string().min(1, { message: "Please select a 'from' member." }),
    toId: z.string().min(1, { message: "Please select a 'to' member." }),
    transactionType: z.enum(transactionTypes, {
        required_error: "Please select a transaction type.",
    }),
    transactionMethod: z.enum(transactionMethods, {
        required_error: "Please select a transaction method.",
    }),
    amount: z.preprocess((val) => Number(val), z.number().min(0.01, { message: "Amount must be greater than 0." })),
    note: z.string().optional(),
});

type MemberTransactionFormProps = {
    members: { name: string; id: string }[];
};

export function MemberTransactionForm({ members }: MemberTransactionFormProps) {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            formId: "",
            toId: "",
            transactionType: "",
            transactionMethod: "",
            amount: 10,
            note: "",
        },
    });

    function onSubmit(data: z.infer<typeof formSchema>) {
        toast(JSON.stringify(data, null, 2));
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="formId"
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

                <FormField
                    control={form.control}
                    name="transactionMethod"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Transaction Method</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select transaction method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {transactionMethods.map((type) => (
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

                <Button type="submit">Submit Transaction</Button>
            </form>
        </Form>
    );
}
