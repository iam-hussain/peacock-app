"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useEffect } from "react";

// Zod schema for validation
const formSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    username: z.string().min(1, "Username is required"),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    avatar: z.string().optional(),
    active: z.boolean().optional(),
});

type MemberFormProps = {
    member?: any; // existing member object, if updating
};

export function MemberForm({ member }: MemberFormProps) {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: member
            ? {
                firstName: member.firstName,
                lastName: member.lastName,
                username: member.username,
                phone: member.phone,
                email: member.email,
                avatar: member.avatar,
                active: member.active,
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

    useEffect(() => {
        if (member) {
            form.reset({
                firstName: member.firstName,
                lastName: member.lastName,
                username: member.username,
                phone: member.phone,
                email: member.email,
                avatar: member.avatar,
                active: member.active,
            });
        }
    }, [member, form]);

    async function onSubmit(data: z.infer<typeof formSchema>) {
        try {
            const response = await fetch(`/api/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: member?.id, ...data }),
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.message || "Failed to process request");
                return;
            }

            const result = await response.json();
            toast.success(member ? "Member updated successfully" : "Member created successfully");
            form.reset(); // Reset form after submission
        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-lg space-y-4">
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

                {/* Active */}
                <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Active</FormLabel>
                            <FormControl>
                                <Input type="checkbox" checked={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full">
                    {member ? "Update Member" : "Create Member"}
                </Button>
            </form>
        </Form>
    );
}
