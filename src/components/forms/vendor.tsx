"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useEffect } from "react";
import { Switch } from "../ui/switch";

// Zod schema for validation
const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    terms: z.number().min(0, "Terms must be a positive number"),
    type: z.enum(["DEFAULT", "CHIT", "LEND", "BANK"], {
        required_error: "Please select a vendor type",
    }),
    ownerId: z.string().optional(),
    termType: z.enum(["NONE", "DAY", "WEEK", "MONTH", "YEAR"]).optional(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
    active: z.boolean(),
});

type VendorFormProps = {
    vendor?: any; // existing vendor object, if updating
    members: { id: string; name: string }[]; // list of members for selection
};

export function VendorForm({ vendor, members }: VendorFormProps) {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: vendor
            ? {
                name: vendor.name,
                slug: vendor.slug,
                terms: vendor.terms,
                type: vendor.type,
                ownerId: vendor.ownerId,
                termType: vendor.termType,
                startAt: vendor.startAt ? new Date(vendor.startAt).toISOString().substring(0, 10) : "",
                endAt: vendor.endAt ? new Date(vendor.endAt).toISOString().substring(0, 10) : "",
                active: vendor.active,
            }
            : {
                name: "",
                slug: "",
                terms: 0,
                type: "DEFAULT",
                ownerId: "",
                termType: "NONE",
                startAt: "",
                endAt: "",
                active: true,
            },
    });

    useEffect(() => {
        if (vendor) {
            form.reset({
                name: vendor.name,
                slug: vendor.slug,
                terms: vendor.terms,
                type: vendor.type,
                ownerId: vendor.ownerId,
                termType: vendor.termType,
                startAt: vendor.startAt ? new Date(vendor.startAt).toISOString().substring(0, 10) : "",
                endAt: vendor.endAt ? new Date(vendor.endAt).toISOString().substring(0, 10) : "",
                active: vendor.active,
            });
        }
    }, [vendor, form]);

    async function onSubmit(data: z.infer<typeof formSchema>) {
        try {
            const response = await fetch(`/api/vendors`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: vendor?.id, ...data }),
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.message || "Failed to process request");
                return;
            }

            const result = await response.json();
            toast.success(vendor ? "Vendor updated successfully" : "Vendor created successfully");
            form.reset(); // Reset form after submission
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-lg space-y-4">
                {/* Name */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Vendor name" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Slug */}
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Vendor slug" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Terms */}
                <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Terms</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} placeholder="Terms" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Type */}
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select vendor type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DEFAULT">DEFAULT</SelectItem>
                                        <SelectItem value="CHIT">CHIT</SelectItem>
                                        <SelectItem value="LEND">LEND</SelectItem>
                                        <SelectItem value="BANK">BANK</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Owner */}
                <FormField
                    control={form.control}
                    name="ownerId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Owner</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select owner" />
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

                {/* Term Type */}
                <FormField
                    control={form.control}
                    name="termType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Term Type</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select term type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">NONE</SelectItem>
                                        <SelectItem value="DAY">DAY</SelectItem>
                                        <SelectItem value="WEEK">WEEK</SelectItem>
                                        <SelectItem value="MONTH">MONTH</SelectItem>
                                        <SelectItem value="YEAR">YEAR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Start Date */}
                <FormField
                    control={form.control}
                    name="startAt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} placeholder="Start date" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* End Date */}
                <FormField
                    control={form.control}
                    name="endAt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} placeholder="End date" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Active */}
                <FormItem className="flex items-center justify-between">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                        <Controller
                            name={`active`}
                            control={form.control}
                            render={({ field }) => (
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    defaultChecked={vendor?.active || true}
                                />
                            )}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>

                <Button type="submit" className="w-full">
                    {vendor ? "Update Vendor" : "Create Vendor"}
                </Button>
            </form>
        </Form>
    );
}
