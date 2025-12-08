"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { DatePickerForm } from "../../atoms/date-picker-form";
import { Button } from "../../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import { Input } from "../../ui/input";
import { Switch } from "../../ui/switch";

import { newZoneDate } from "@/lib/date";
import fetcher from "@/lib/fetcher";
import { accountFormSchema, AccountFromSchema } from "@/lib/form-schema";

type MemberFormProps = {
  selected?: any;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function MemberForm({ selected, onSuccess, onCancel }: MemberFormProps) {
  const form = useForm({
    resolver: zodResolver(accountFormSchema),
    defaultValues: selected
      ? {
          firstName: selected.firstName,
          lastName: selected.lastName || "",
          slug: selected.slug || "",
          phone: selected.phone || "",
          email: selected.email || "",
          avatar: selected.avatar || "",
          active: selected.active ?? true,
          startAt: newZoneDate(selected.startAt || undefined),
          endAt: undefined,
        }
      : {
          firstName: "",
          lastName: "",
          slug: nanoid(8),
          phone: "",
          email: "",
          avatar: "",
          active: true,
          startAt: newZoneDate(),
          endAt: undefined,
        },
  });

  const mutation = useMutation({
    mutationFn: (body: any) =>
      fetcher.post("/api/account", {
        body: { id: selected?.id, ...body, isMember: true },
      }),
    onSuccess: async (data: any) => {
      toast.success(
        selected ? "Member updated successfully" : "Member created successfully"
      );
      form.reset(data?.account || {});
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  async function onSubmit(variables: AccountFromSchema) {
    return await mutation.mutateAsync(variables as any);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        {/* System ID (Slug) - Readonly */}
        {selected && selected.slug && (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                System ID
              </span>
              <span className="text-sm font-mono text-foreground">
                {selected.slug}
              </span>
            </div>
          </div>
        )}

        {/* Two-column grid on desktop, single on mobile */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* First Name */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="First name" className="h-10" />
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
                  <Input {...field} placeholder="Last name" className="h-10" />
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
                  <Input
                    {...field}
                    type="email"
                    placeholder="name@example.com"
                    className="h-10"
                  />
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
                  <Input
                    {...field}
                    type="tel"
                    placeholder="+91..."
                    className="h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Joined Date */}
          <FormField
            control={form.control}
            name="startAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Joined Date</FormLabel>
                <DatePickerForm
                  field={field}
                  placeholder="Select joined date"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Avatar URL */}
          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://..."
                    className="h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Status Toggle - Full width */}
        <FormItem className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Status</FormLabel>
            <p className="text-sm text-muted-foreground">
              Active members can participate in club activities
            </p>
          </div>
          <FormControl>
            <Controller
              name="active"
              control={form.control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </FormControl>
        </FormItem>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              onCancel?.();
            }}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Saving..."
              : selected
                ? "Save Changes"
                : "Add Member"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
