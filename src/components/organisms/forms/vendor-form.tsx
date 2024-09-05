"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { DatePickerForm } from "../../atoms/date-picker-form";
import { GenericModalFooter } from "../../atoms/generic-modal";
import Box from "../../ui/box";
import { Switch } from "../../ui/switch";

import { TransformedMemberSelect } from "@/app/api/member/select/route";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vendorTypeMap } from "@/lib/config";
import fetcher from "@/lib/fetcher";
import { vendorFormSchema, VendorFromSchema } from "@/lib/form-schema";

type VendorFormProps = {
  selected?: any; // existing vendor object, if updating
  members: TransformedMemberSelect[]; // list of members for selection
  onSuccess: () => void;
  onCancel?: () => void;
};

export function VendorForm({
  selected,
  members,
  onSuccess,
  onCancel,
}: VendorFormProps) {
  const queryClient = useQueryClient();

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

  const mutation = useMutation({
    mutationFn: (body: any) =>
      fetcher.post("/api/vendor", { body: { id: selected?.id, ...body } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["vendor-details"],
      });

      toast.success(
        selected
          ? "Vendor updated successfully 🌟"
          : "Vendor created successfully 🚀",
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

  async function onSubmit(variables: VendorFromSchema) {
    return await mutation.mutateAsync(variables as any);
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
                      {Object.entries(vendorTypeMap).map(([key, name]) => (
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
          isSubmitting={form.formState.isSubmitting || mutation.isPending}
        />
      </form>
    </Form>
  );
}
