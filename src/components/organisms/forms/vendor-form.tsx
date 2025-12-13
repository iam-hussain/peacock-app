"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AvatarUpload } from "../../atoms/avatar-upload";
import { DatePickerForm } from "../../atoms/date-picker-form";
import { PhoneInput } from "../../atoms/phone-input";
import { Button } from "../../ui/button";
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
import { newZoneDate } from "@/lib/core/date";
import fetcher from "@/lib/core/fetcher";
import { accountFormSchema, AccountFromSchema } from "@/lib/validators/form-schema";

type VendorFormProps = {
  selected?: any; // existing vendor object, if updating
  onSuccess: () => void;
  onCancel?: () => void;
};

export function VendorForm({ selected, onSuccess, onCancel }: VendorFormProps) {
  const queryClient = useQueryClient();
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

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
        body: { id: selected?.id, ...body, type: 'VENDOR' },
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

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Pass old image URL for deletion if updating existing vendor
      const currentAvatar = selected?.avatar || form.getValues("avatar");
      if (currentAvatar && selected) {
        // Extract filename from avatar URL
        const oldImageUrl = currentAvatar.startsWith("/image/")
          ? currentAvatar
          : currentAvatar.startsWith("/")
            ? currentAvatar
            : `/image/${currentAvatar}`;
        formData.append("oldImageUrl", oldImageUrl);
      }

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload avatar");
      }

      const data = await response.json();
      // Extract filename from URL (e.g., /image/avatar_123.jpg -> avatar_123.jpg)
      const filename = data.url.replace("/image/", "").replace(/^\//, "");
      form.setValue("avatar", filename);
      toast.success("Avatar uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
      throw error;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
                <FormLabel>Additional Name (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Additional name"
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
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
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
                <FormLabel>Email (Optional)</FormLabel>
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
                <FormLabel>Start Date (Optional)</FormLabel>
                <DatePickerForm field={field} placeholder="Select start date" />
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
                <DatePickerForm field={field} placeholder="Select end date" />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Avatar Upload */}
          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar (Optional)</FormLabel>
                <FormControl>
                  <AvatarUpload
                    value={field.value || ""}
                    onChange={field.onChange}
                    onFileSelect={handleAvatarUpload}
                    disabled={mutation.isPending || isUploadingAvatar}
                    oldImageUrl={selected?.avatar || null}
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
            disabled={mutation.isPending || isUploadingAvatar}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || isUploadingAvatar}
          >
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
