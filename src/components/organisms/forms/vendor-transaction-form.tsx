"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TransformedVendorTransaction } from "@/app/api/vendor/transaction/route";
import { GenericModalFooter } from "../../atoms/generic-modal";
import Box from "../../ui/box";
import { transactionMethodMap, vendorTransactionTypeMap } from "@/lib/config";
import {
  VendorTransactionFormSchema,
  vendorTransactionFormSchema,
} from "@/lib/form-schema";
import { DatePickerForm } from "../../atoms/date-picker-form";
import { TransformedVendorSelect } from "@/app/api/vendor/select/route";
import { TransformedMemberSelect } from "@/app/api/member/select/route";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import fetcher from "@/lib/fetcher";

type VendorTransactionFormProps = {
  vendors: TransformedMemberSelect[];
  members: TransformedVendorSelect[];
  selected: null | TransformedVendorTransaction;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function VendorTransactionForm({
  vendors,
  members,
  selected,
  onSuccess,
  onCancel,
}: VendorTransactionFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<VendorTransactionFormSchema>({
    resolver: zodResolver(vendorTransactionFormSchema),
    defaultValues: selected
      ? {
          vendorId: selected.vendorId,
          memberId: selected.memberId || "",
          transactionType: selected.transactionType as any,
          method: (selected.method as any) || "ACCOUNT",
          amount: selected.amount || 0,
          note: selected.note || "",
          transactionAt: selected.transactionAt
            ? new Date(selected.transactionAt)
            : new Date(),
        }
      : {
          vendorId: "",
          memberId: "",
          transactionType: "INVEST",
          method: "ACCOUNT",
          amount: 0,
          note: "",
          transactionAt: new Date(),
        },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetcher.delete(`/api/vendor/transaction/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["vendor-transaction"],
      });
    },
    onError: (error) => {
      toast.error(
        `Error: ${error.message || "Failed to delete member transaction"}`,
      );
    },
  });

  const mutation = useMutation({
    mutationFn: (body: any) =>
      fetcher.post("/api/vendor/transaction", {
        body: { createdAt: selected?.transactionAt, ...body },
      }),
    onSuccess: async () => {
      if (selected && selected?.id) {
        await deleteMutation.mutateAsync(selected.id);
      }

      if (selected) {
        toast.success("Vendor transaction successfully updated!");
      } else {
        toast.success("Vendor transaction successfully added!");
      }
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

  async function onSubmit(variables: VendorTransactionFormSchema) {
    return await mutation.mutateAsync(variables as any);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-2xl space-y-4"
      >
        <Box preset={"grid-split"}>
          {/* Vendor Selection */}
          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Member Selection */}
          <FormField
            control={form.control}
            name="memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Member</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
        </Box>

        <Box preset={"grid-split"}>
          {/* Transaction Type Selection */}
          <FormField
            control={form.control}
            name="transactionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Type</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(vendorTransactionTypeMap).map(
                        ([key, name]) => (
                          <SelectItem key={key} value={key}>
                            {name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Transaction Method Selection */}
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Method</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction method" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(transactionMethodMap).map(
                        ([key, name]) => (
                          <SelectItem key={key} value={key}>
                            {name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Box>
        <Box preset={"grid-split"}>
          {/* Start Date */}

          {/* Amount Input */}
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
            name="transactionAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Date</FormLabel>
                <FormControl>
                  <DatePickerForm
                    field={field}
                    placeholder="Transaction date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Box>

        {/* Note Input */}
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

        {/* Submit Button */}
        <GenericModalFooter
          actionLabel={selected ? "Update" : "Add"}
          onCancel={onCancel}
          isSubmitting={mutation.isPending || deleteMutation.isPending}
        />
      </form>
    </Form>
  );
}
