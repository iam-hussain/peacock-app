"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DatePickerForm } from "../../atoms/date-picker-form";
import { GenericModalFooter } from "../../atoms/generic-modal";
import Box from "../../ui/box";

import { TransformedMemberSelect } from "@/app/api/member/select/route";
import { TransformedTransaction } from "@/app/api/transaction/route";
import { TransformedVendorSelect } from "@/app/api/vendor/select/route";
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
import { Textarea } from "@/components/ui/textarea";
import {
  transactionTypeHumanMap,
  vendorTypeTransactionMap,
} from "@/lib/config";
import fetcher from "@/lib/fetcher";
import {
  TransactionFormSchema,
  transactionFormSchema,
} from "@/lib/form-schema";
import { cn } from "@/lib/utils";

type TransactionFormProps = {
  vendors: TransformedMemberSelect[];
  members: TransformedVendorSelect[];
  selected: null | TransformedTransaction;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function TransactionForm({
  vendors,
  members,
  selected,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: selected
      ? {
          fromId: selected.fromId || "",
          toId: selected.toId || "",
          transactionType: selected.transactionType as any,
          vendorType: (selected?.vendorType as any) || "DEFAULT",
          method: (selected.method as any) || "ACCOUNT",
          amount: selected.amount || 0,
          note: selected.note || "",
          transactionAt: selected.transactionAt
            ? new Date(selected.transactionAt)
            : new Date(),
        }
      : {
          fromId: "",
          toId: "",
          transactionType: "PERIODIC_DEPOSIT",
          vendorType: "DEFAULT",
          method: "ACCOUNT",
          amount: 0,
          note: "",
          transactionAt: new Date(),
        },
  });

  const transactionType = form.watch("transactionType") || "PERIODIC_DEPOSIT";
  const vendorType = form.watch("vendorType");

  const showVendorType = useMemo(() => {
    if (["INVEST", "PROFIT", "RETURNS"].includes(transactionType)) {
      return true;
    }
    return false;
  }, [transactionType]);

  const formToLabels = useMemo(() => {
    if (
      ["PERIODIC_DEPOSIT", "OFFSET_DEPOSIT", "REJOIN", "WITHDRAW"].includes(
        transactionType
      )
    ) {
      return ["Member", "Club"];
    }
    if (["FUNDS_TRANSFER"].includes(transactionType)) {
      return ["Club Sender", "Club Receiver"];
    }

    if (
      ["INVEST", "PROFIT", "RETURNS"].includes(transactionType) &&
      vendorType === "DEFAULT"
    ) {
      return ["Vendor", "Club"];
    }

    if (
      ["INVEST", "PROFIT", "RETURNS"].includes(transactionType) &&
      vendorType === "LEND"
    ) {
      return ["Loan", "Club"];
    }

    return ["Member", "Club"];
  }, [transactionType, vendorType]);

  const formToValues = useMemo(() => {
    if (
      [
        "PERIODIC_DEPOSIT",
        "OFFSET_DEPOSIT",
        "REJOIN",
        "WITHDRAW",
        "FUNDS_TRANSFER",
      ].includes(transactionType)
    ) {
      return [members, members];
    }

    if (
      ["INVEST", "PROFIT", "RETURNS"].includes(transactionType) &&
      vendorType === "DEFAULT"
    ) {
      return [vendors, members];
    }

    if (
      ["INVEST", "PROFIT", "RETURNS"].includes(transactionType) &&
      vendorType === "LEND"
    ) {
      return [members, members];
    }

    return [members, members];
  }, [transactionType, vendorType]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetcher.delete(`/api/transaction/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["fetch-transaction", "all-transaction"],
      });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message || "Failed to delete transaction"}`);
    },
  });

  const mutation = useMutation({
    mutationFn: (body: any) =>
      fetcher.post("/api/transaction", {
        body: { createdAt: selected?.transactionAt, ...body },
      }),
    onSuccess: async () => {
      if (selected && selected?.id) {
        await deleteMutation.mutateAsync(selected.id);
      }

      if (selected) {
        toast.success("Transaction successfully updated!");
      } else {
        toast.success("Transaction successfully added!");
      }
      if (!selected) form.reset(); // Reset form after submission
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

  async function onSubmit(variables: TransactionFormSchema) {
    return await mutation.mutateAsync(variables as any);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-2xl space-y-4"
      >
        <Box preset={"grid-split-3"}>
          {/* Transaction Type Selection */}
          <FormField
            control={form.control}
            name="transactionType"
            render={({ field }) => (
              <FormItem
                className={cn({
                  "col-span-3": !showVendorType,
                  "col-span-2": showVendorType,
                })}
              >
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
                      {Object.entries(transactionTypeHumanMap).map(
                        ([key, name]) => (
                          <SelectItem key={key} value={key}>
                            {name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {showVendorType && (
            <FormField
              control={form.control}
              name="vendorType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction method" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(vendorTypeTransactionMap).map(
                          ([key, name]) => (
                            <SelectItem key={key} value={key}>
                              {name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Transaction Method Selection */}
          {/* <FormField
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
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}
        </Box>

        <Box preset={"grid-split"}>
          {/* Member Selection */}
          <FormField
            control={form.control}
            name="fromId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{formToLabels[0]}</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`Select ${formToLabels[0].toLocaleLowerCase()}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {formToValues[0].map((member) => (
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

          {/* Vendor Selection */}
          <FormField
            control={form.control}
            name="toId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{formToLabels[1]}</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`Select ${formToLabels[1].toLocaleLowerCase()}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {formToValues[1].map((vendor) => (
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
