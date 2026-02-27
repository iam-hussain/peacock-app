"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TransformedAccountSelect } from "@/app/api/account/select/route";
import { DatePickerForm } from "@/components/atoms/date-picker-form";
import { GenericModalFooter } from "@/components/atoms/generic-modal";
import Box from "@/components/ui/box";
import { Button } from "@/components/ui/button";
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
import { transactionTypeHumanMap } from "@/lib/config/config";
import { newZoneDate } from "@/lib/core/date";
import fetcher from "@/lib/core/fetcher";
import {
  TransactionFormSchema,
  transactionFormSchema,
} from "@/lib/validators/form-schema";

type TransactionFormProps = {
  accounts: TransformedAccountSelect[];
  selected?: any | null;
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
      accounts.filter((account) => account.isMember),
      accounts.filter((account) => !account.isMember),
    ];
  }, [accounts]);

  const form = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: selected
      ? {
          fromId: selected.fromId || "",
          toId: selected.toId || "",
          transactionType:
            selected.type || selected.transactionType || "PERIODIC_DEPOSIT",
          method: selected.method || "ACCOUNT",
          amount: selected.amount || 0,
          note: selected.description || selected.note || "",
          transactionAt: selected.occurredAt
            ? newZoneDate(selected.occurredAt)
            : newZoneDate(),
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
    if (transactionType === "WITHDRAW") return ["Club - FROM", "Member - TO"];
    if (["FUNDS_TRANSFER"].includes(transactionType))
      return ["Club - FROM", "Club - TO"];
    if (["VENDOR_RETURNS"].includes(transactionType))
      return ["Vendor - FROM", "Club - TO"];
    if (["LOAN_REPAY", "LOAN_INTEREST"].includes(transactionType))
      return ["Loan - FROM", "Club - TO"];
    if (transactionType === "VENDOR_INVEST")
      return ["Club - FROM", "Vendor - TO"];
    if (transactionType === "LOAN_TAKEN") return ["Club - FROM", "Loan - TO"];
    return ["Member - FROM", "Club - TO"];
  }, [transactionType]);

  const formToValues = useMemo(() => {
    if (["VENDOR_RETURNS"].includes(transactionType)) return [vendors, members];
    if (transactionType === "VENDOR_INVEST") return [members, vendors];
    return [members, members];
  }, [transactionType, members, vendors]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetcher.delete(`/api/transaction/${id}`),
    onSuccess: async () => {},
    onError: (error: any) => {
      toast.error(`Error: ${error.message || "Failed to delete transaction"}`);
    },
  });

  const mutation = useMutation({
    mutationFn: (body: any) =>
      fetcher.post("/api/transaction/create", {
        body,
      }),
    onSuccess: async ({ transaction }: any = {}) => {
      if (!selected) {
        form.reset({
          ...transaction,
          transactionAt: transaction?.occurredAt
            ? newZoneDate(transaction.occurredAt)
            : newZoneDate(),
          note: transaction?.description || "",
        });
      }
      if (selected?.id) {
        await deleteMutation.mutateAsync(selected.id);
      }

      await queryClient.invalidateQueries({ queryKey: ["all"] });

      toast.success(
        selected
          ? "Transaction successfully updated!"
          : "Transaction successfully added!"
      );
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  const onSubmit = async (values: TransactionFormSchema) => {
    return await mutation.mutateAsync({
      ...values,
      occurredAt: values.transactionAt,
      description: values.note,
    });
  };

  const isSubmitting = mutation.isPending || deleteMutation.isPending;

  return (
    <Form {...form}>
      <form
        id="transaction-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={
          isMobile ? "w-full space-y-4 pb-20" : "w-full max-w-2xl space-y-6"
        }
      >
        {isMobile ? (
          <FormField
            control={form.control}
            name="transactionType"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">
                  Transaction Type *
                </FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
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
        ) : (
          <FormField
            control={form.control}
            name="transactionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Transaction Type *
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
        )}

        {isMobile ? (
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="fromId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {formToLabels[0] ?? "From"} *
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue
                          placeholder={`Select ${(formToLabels[0] ?? "item").toLowerCase()}`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(formToValues[0] ?? []).map((member) => (
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

            <FormField
              control={form.control}
              name="toId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {formToLabels[1] ?? "To"} *
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue
                          placeholder={`Select ${(formToLabels[1] ?? "item").toLowerCase()}`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(formToValues[1] ?? []).map((vendor) => (
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
          </div>
        ) : (
          <Box preset={"grid-split"}>
            <FormField
              control={form.control}
              name="fromId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {formToLabels[0] ?? "From"} *
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue
                          placeholder={`Select ${(formToLabels[0] ?? "item").toLowerCase()}`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(formToValues[0] ?? []).map((member) => (
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

            <FormField
              control={form.control}
              name="toId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {formToLabels[1] ?? "To"} *
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue
                          placeholder={`Select ${(formToLabels[1] ?? "item").toLowerCase()}`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(formToValues[1] ?? []).map((vendor) => (
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
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Amount *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="Enter amount"
                      className="h-11 rounded-xl"
                      {...field}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value === "" ? "" : Number(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transactionAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Transaction Date (Optional)
                  </FormLabel>
                  <FormControl>
                    <DatePickerForm
                      field={field}
                      placeholder="Transaction date"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <Box preset={"grid-split"}>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Amount *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      className="h-11 rounded-lg"
                      {...field}
                      onChange={(event) => {
                        const value = event.target.value;
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

            <FormField
              control={form.control}
              name="transactionAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Transaction Date (Optional)
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

        {isMobile ? (
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Note (Optional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add a short note"
                    className="min-h-[100px] rounded-xl resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Note (Optional)
                </FormLabel>
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
        )}

        {!isMobile && (
          <GenericModalFooter
            actionLabel={selected ? "Update Transaction" : "Add Transaction"}
            onCancel={onCancel}
            isSubmitting={isSubmitting}
          />
        )}
        {isMobile && (
          <div className="sticky bottom-0 left-0 right-0 -mx-4 flex gap-3 border-t border-border bg-background/95 px-4 py-4 pb-safe shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="flex-1 h-11 rounded-xl"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 rounded-xl"
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
