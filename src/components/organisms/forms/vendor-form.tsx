"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "../../ui/switch";
import { vendorFormSchema, VendorFromSchema } from "@/lib/form-schema";
import Box from "../../ui/box";
import { GenericModalFooter } from "../../atoms/generic-modal";
import { toast } from "sonner";
import { DatePickerForm } from "../../atoms/date-picker-form";

type VendorFormProps = {
  selected?: any; // existing vendor object, if updating
  members: any[]; // list of members for selection
  onSuccess: () => void;
  onCancel?: () => void;
};

export function VendorForm({
  selected,
  members,
  onSuccess,
  onCancel,
}: VendorFormProps) {
  const form = useForm({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: selected
      ? {
          name: selected.name,
          slug: selected.slug || "",
          terms: selected.terms || 0,
          type: selected.type || "DEFAULT",
          ownerId: selected.ownerId || "",
          termType: selected.termType || "MONTH",
          startAt: selected.startAt ? new Date(selected.startAt) : undefined,
          endAt: selected.endAt ? new Date(selected.endAt) : undefined,
          active: selected.active ?? true,
          calcReturns: selected.calcReturns ?? true,
        }
      : {
          name: "",
          slug: "",
          terms: 0,
          type: "DEFAULT",
          ownerId: "",
          termType: "MONTH",
          startAt: new Date(),
          endAt: undefined,
          active: true,
          calcReturns: true,
        },
  });

  async function onSubmit(data: VendorFromSchema) {
    try {
      const response = await fetch(`/api/vendors`, {
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
      toast.success(
        selected
          ? "Vendor updated successfully"
          : "Vendor created successfully",
      );

      if (!selected) form.reset(); // Reset form after submission
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-lg space-y-4"
      >
        <Box preset={"grid-split"}>
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
        </Box>
        <Box preset={"grid-split"}>
          {/* Terms */}
          {/* <FormField
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
                    /> */}

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
          {/* Term Type
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
                    /> */}
        </Box>

        <Box preset={"grid-split"}>
          {/* Start Date */}
          <FormField
            control={form.control}
            name="startAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <DatePickerForm field={field} placeholder="Start date" />
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
                  <DatePickerForm field={field} placeholder="End date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Box>

        <Box preset={"grid-split"} className="pt-2">
          {/* calcReturns */}
          <FormItem className="flex items-center justify-between border border-input px-3 min-h-[36px] py-1 rounded-md">
            <FormLabel>Calculate Returns</FormLabel>
            <FormControl>
              <Controller
                name={`calcReturns`}
                control={form.control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    defaultChecked={selected?.calcReturns ?? true}
                    className="m-0 mt-0"
                  />
                )}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          {/* Active */}
          <FormItem className="flex items-center justify-between border border-input px-3 min-h-[36px] py-1 rounded-md">
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
          actionLabel={selected ? "Update Vendor" : "Add Vendor"}
          onCancel={onCancel}
          isSubmitting={form.formState.isSubmitting}
        />
      </form>
    </Form>
  );
}
