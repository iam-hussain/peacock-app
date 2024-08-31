"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "../ui/switch";
import Box from "../ui/box";
import { memberFormSchema, MemberFromSchema } from "@/lib/form-schema";
import { GenericModalFooter } from "../generic-modal";
import { toast } from "sonner";


type MemberFormProps = {
    selected?: any,
    onSuccess: () => void
    onCancel?: () => void
};

export function MemberForm({ selected, onSuccess, onCancel }: MemberFormProps) {
    const form = useForm({
        resolver: zodResolver(memberFormSchema),
        defaultValues: selected
            ? {
                firstName: selected.firstName,
                lastName: selected.lastName || '',
                username: selected.username,
                phone: selected.phone || '',
                email: selected.email || '',
                avatar: selected.avatar || '',
                active: selected.active ?? true,
            }
            : {
                firstName: "",
                lastName: "",
                username: "",
                phone: "",
                email: "",
                avatar: "",
                active: true,
            },
    });

    async function onSubmit(data: MemberFromSchema) {
        try {
            const response = await fetch(`/api/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: selected?.id, ...data }),
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.message || "Failed to process request");
                return;
            }

            const result = await response.json();
            toast.success(selected ? "Member updated successfully" : "Member created successfully");
            if (!selected) form.reset(); // Reset form after submission
            if (onSuccess) {
                onSuccess()
            }

        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl space-y-4">
                <Box preset={'grid-split'}>
                    {/* First Name */}
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="First name" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Last Name */}
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Last name" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </Box>


                <Box preset={'grid-split'}>
                    {/* Phone */}
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Phone" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Email" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </Box>


                <Box preset={'grid-split'}>
                    {/* Username */}
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Username" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* Avatar */}
                    <FormField
                        control={form.control}
                        name="avatar"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Avatar URL</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Avatar URL" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </Box>

                <Box preset={'grid-split'}>
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
                                        defaultChecked={selected?.active ?? true}
                                    />
                                )}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </Box>

                <GenericModalFooter actionLabel={selected ? "Update Member" : "Add Member"} onCancel={onCancel} />
            </form>
        </Form>
    );
}
