"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DatePickerForm } from "../../atoms/date-picker-form";
import { GenericModalFooter } from "../../atoms/generic-modal";
import Box from "../../ui/box";
import { Button } from "../../ui/button";

import { TransformedAccountSelect } from "@/app/api/account/select/route";
import { TransformedTransaction } from "@/app/api/transaction/route";
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
import { transactionTypeHumanMap } from "@/lib/config";
import { newZoneDate } from "@/lib/date";
import fetcher from "@/lib/fetcher";
import {
  TransactionFormSchema,
  transactionFormSchema,
} from "@/lib/form-schema";

type TransactionFormProps = {
  accounts: TransformedAccountSelect[];
  selected: null | TransformedTransaction;
  onSuccess: () => void;
  onCancel?: () => void;
  isMobile?: boolean;
};

export function TransactionForm({
  accounts,
  selected,
  onSuccess,
  onCancel,
  isMobile = false,
}: TransactionFormProps) {
  const queryClient = useQueryClient();

  const [members, vendors] = useMemo(() => {
    return [
      accounts.filter((e) => e.isMember),
      accounts.filter((e) => !e.isMember),
    ];
  }, [accounts]);

  const form = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: selected
      ? {
          fromId: selected?.fromId || "",
          toId: selected?.toId || "",
          transactionType: selected.transactionType as any,
          method: (selected.method as any) || "ACCOUNT",
          amount: selected.amount || 0,
          note: selected.note || "",
          transactionAt: newZoneDate(selected.transactionAt || undefined),
        }
      : {
          fromId: "",
          toId: "",
          transactionType: "PERIODIC_DEPOSIT",
          method: "ACCOUNT",
          amount: 0,
          note: "",
          transactionAt: newZoneDate(),
        },
  });

  const transactionType = form.watch("transactionType") || "PERIODIC_DEPOSIT";

  const formToLabels = useMemo(() => {
    if (transactionType === "WITHDRAW") {
      return ["Club - FROM", "Member - TO"];
    }
    if (["FUNDS_TRANSFER"].includes(transactionType)) {
      return ["Club - FROM", "Club - TO"];
    }

    if (["VENDOR_RETURNS"].includes(transactionType)) {
      return ["Vendor - FROM", "Club - TO"];
    }

    if (["LOAN_REPAY", "LOAN_INTEREST"].includes(transactionType)) {
      return ["Loan - FROM", "Club - TO"];
    }

    if (transactionType === "VENDOR_INVEST") {
      return ["Club - FROM", "Vendor - TO"];
    }

    if (transactionType === "LOAN_TAKEN") {
      return ["Club - FROM", "Loan - TO"];
    }

    return ["Member - FROM", "Club - TO"];
  }, [transactionType]);

  const formToValues = useMemo(() => {
    if (["VENDOR_RETURNS"].includes(transactionType)) {
      return [vendors, members];
    }

    if (transactionType === "VENDOR_INVEST") {
      return [members, vendors];
    }

    return [members, members];
  }, [transactionType, members, vendors]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetcher.delete(`/api/transaction/${id}`),
    onSuccess: async () => {},
    onError: (error) => {
      toast.error(`Error: ${error.message || "Failed to delete transaction"}`);
    },
  });

  const mutation = useMutation({
    mutationFn: (body: any) =>
      fetcher.post("/api/transaction/add", {
        body: { createdAt: selected?.transactionAt, ...body },
      }),
    onSuccess: async ({ transaction }: any = {}) => {
      if (!selected) form.reset(transaction); // Reset form after submission
      if (selected && selected?.id) {
        await deleteMutation.mutateAsync(selected.id);
      }

      await queryClient.invalidateQueries({ queryKey: ["all"] });

      const recalculatedIds = new Set();
      if (
        selected?.transactionType &&
        selected?.transactionType === "LOAN_TAKEN" &&
        selected?.toId
      ) {
        recalculatedIds.add(selected?.toId);
      }
      if (
        selected?.transactionType &&
        selected?.transactionType === "LOAN_REPAY" &&
        selected?.fromId
      ) {
        recalculatedIds.add(selected?.fromId);
      }
      if (transactionType === "LOAN_TAKEN" && transaction?.toId) {
        recalculatedIds.add(transaction?.toId);
      }
      if (transactionType === "LOAN_REPAY" && transaction?.fromId) {
        recalculatedIds.add(transaction?.fromId);
      }

      if (selected) {
        toast.success("Transaction successfully updated!");
      } else {
        toast.success("Transaction successfully added!");
      }
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

  const isSubmitting = mutation.isPending || deleteMutation.isPending;

  return (
    <Form {...form}>
      <form
        id="transaction-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={isMobile ? "w-full space-y-6" : "w-full max-w-2xl space-y-6"}
      >
        {/* Transaction Type Selection */}
        <FormField
          control={form.control}
          name="transactionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Transaction Type
              </FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="h-11 rounded-lg">
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
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {isMobile ? (
          <>
            {/* Member Selection - Mobile: Stacked */}
            <FormField
              control={form.control}
              name="fromId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {formToLabels[0]}
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue
                          placeholder={`Select ${formToLabels[0].toLowerCase()}`}
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
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Vendor Selection - Mobile: Stacked */}
            <FormField
              control={form.control}
              name="toId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {formToLabels[1]}
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue
                          placeholder={`Select ${formToLabels[1].toLowerCase()}`}
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
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </>
        ) : (
          <Box preset={"grid-split"}>
            {/* Member Selection - Desktop: Side by side */}
            <FormField
              control={form.control}
              name="fromId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {formToLabels[0]}
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue
                          placeholder={`Select ${formToLabels[0].toLowerCase()}`}
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
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Vendor Selection - Desktop: Side by side */}
            <FormField
              control={form.control}
              name="toId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {formToLabels[1]}
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue
                          placeholder={`Select ${formToLabels[1].toLowerCase()}`}
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
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </Box>
        )}

        {isMobile ? (
          <>
            {/* Amount Input - Mobile: Stacked */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      className="h-11 rounded-lg"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? "" : Number(value));
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Enter total amount for this transaction.
                  </p>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            {/* Transaction Date - Mobile: Stacked */}
            <FormField
              control={form.control}
              name="transactionAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Transaction Date
                  </FormLabel>
                  <FormControl>
                    <DatePickerForm
                      field={field}
                      placeholder="Transaction date"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Defaults to today if not changed.
                  </p>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </>
        ) : (
          <Box preset={"grid-split"}>
            {/* Amount Input - Desktop: Side by side */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      className="h-11 rounded-lg"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? "" : Number(value));
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Enter total amount for this transaction.
                  </p>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            {/* Transaction Date - Desktop: Side by side */}
            <FormField
              control={form.control}
              name="transactionAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Transaction Date
                  </FormLabel>
                  <FormControl>
                    <DatePickerForm
                      field={field}
                      placeholder="Transaction date"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Defaults to today if not changed.
                  </p>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </Box>
        )}

        {/* Note Input */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional note"
                  className="min-h-[100px] rounded-lg resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        {!isMobile && (
          <GenericModalFooter
            actionLabel={selected ? "Update Transaction" : "Add Transaction"}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
          />
        )}
        {isMobile && (
          <div className="flex gap-3 w-full pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="flex-1 h-11 rounded-lg"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 rounded-lg"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Adding..."
                : selected
                  ? "Update Transaction"
                  : "Add Transaction"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
