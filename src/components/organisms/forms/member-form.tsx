"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { DatePickerForm } from "../../atoms/date-picker-form";
import { GenericModalFooter } from "../../atoms/generic-modal";
import Box from "../../ui/box";
import { Switch } from "../../ui/switch";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import fetcher from "@/lib/fetcher";
import { memberFormSchema, MemberFromSchema } from "@/lib/form-schema";

type MemberFormProps = {
  selected?: any;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function MemberForm({ selected, onSuccess, onCancel }: MemberFormProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(memberFormSchema),
    defaultValues: selected
      ? {
          firstName: selected.firstName,
          lastName: selected.lastName || "",
          username: selected.username,
          phone: selected.phone || "",
          email: selected.email || "",
          avatar: selected.avatar || "",
          active: selected.active ?? true,
          joinedAt: selected.joinedAt
            ? new Date(selected.joinedAt)
            : new Date(),
        }
      : {
          firstName: "",
          lastName: "",
          username: "",
          phone: "",
          email: "",
          avatar: "",
          active: true,
          joinedAt: new Date(),
        },
  });

  const mutation = useMutation({
    mutationFn: (body: any) =>
      fetcher.post("/api/member", { body: { id: selected?.id, ...body } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["member-details"],
      });

      toast.success(
        selected
          ? "Member updated successfully 🌟"
          : "Member created successfully 🚀",
      );
      if (!selected) form.reset(); // Reset form after submission
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  async function onSubmit(variables: MemberFromSchema) {
    return await mutation.mutateAsync(variables as any);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-2xl space-y-4"
      >
        <Box preset={"grid-split"}>
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

        <Box preset={"grid-split"}>
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

        <Box preset={"grid-split"}>
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

        <Box preset={"grid-split"}>
          <FormField
            control={form.control}
            name="joinedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Joined Date</FormLabel>
                <DatePickerForm field={field} placeholder="Joined date" />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Active */}
          <FormItem className="flex items-center justify-between align-bottom border border-input px-3 min-h-[36px] mt-auto w-full rounded-md">
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

        <GenericModalFooter
          actionLabel={selected ? "Update Member" : "Add Member"}
          onCancel={onCancel}
          isSubmitting={form.formState.isSubmitting || mutation.isPending}
        />
      </form>
    </Form>
  );
}
