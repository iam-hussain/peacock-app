"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DatePickerForm } from "../../atoms/date-picker-form";
import { Switch } from "../../ui/switch";
import { Button } from "../../ui/button";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { newZoneDate } from "@/lib/date";
import fetcher from "@/lib/fetcher";
import { accountFormSchema, AccountFromSchema } from "@/lib/form-schema";

type VendorFormProps = {
  selected?: any; // existing vendor object, if updating
  onSuccess: () => void;
  onCancel?: () => void;
};

export function VendorForm({ selected, onSuccess, onCancel }: VendorFormProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(accountFormSchema),
    defaultValues: selected
      ? {
          firstName: selected.firstName,
          lastName: selected.lastName || "",
          phone: selected.phone || "",
          email: selected.email || "",
          avatar: selected.avatar || "",
          active: selected.active ?? true,
          startAt: newZoneDate(selected.startAt || undefined),
          endAt: newZoneDate(selected.endAt || undefined),
        }
      : {
          firstName: "",
          lastName: "",
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
        body: { id: selected?.id, ...body, isMember: false },
      }),
    onSuccess: async (data: any) => {
      await queryClient.invalidateQueries({ queryKey: ["vendor"] });

      toast.success(
        selected
          ? "Vendor updated successfully 🌟"
          : "Vendor created successfully 🚀"
      );
      form.reset(data?.account || {}); // Reset form after submission
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
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
        {/* Two-column grid on desktop, single on mobile */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Vendor Name (First Name) */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Vendor name"
                    className="h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name (Optional) */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Additional name (optional)"
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

          {/* Start Date */}
          <FormField
            control={form.control}
            name="startAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <DatePickerForm
                  field={field}
                  placeholder="Select start date"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date (Optional) */}
          <FormField
            control={form.control}
            name="endAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date (Optional)</FormLabel>
                <DatePickerForm
                  field={field}
                  placeholder="Select end date (optional)"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Avatar URL (Optional) */}
          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar URL (Optional)</FormLabel>
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
              Active vendors are included in investment cycles
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
                : "Add Vendor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
