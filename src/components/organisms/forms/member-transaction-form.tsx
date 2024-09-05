"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DatePickerForm } from "../../atoms/date-picker-form";
import { GenericModalFooter } from "../../atoms/generic-modal";
import Box from "../../ui/box";

import { TransformedMemberSelect } from "@/app/api/member/select/route";
import { TransformedMemberTransaction } from "@/app/api/member/transaction/route";
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
import { memberTransactionTypeMap, transactionMethodMap } from "@/lib/config";
import fetcher from "@/lib/fetcher";
import {
  MemberTransactionFormSchema,
  memberTransactionFormSchema,
} from "@/lib/form-schema";

type MemberTransactionFormProps = {
  members: TransformedMemberSelect[];
  selected: null | TransformedMemberTransaction;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function MemberTransactionForm({
  members,
  selected,
  onSuccess,
  onCancel,
}: MemberTransactionFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<MemberTransactionFormSchema>({
    resolver: zodResolver(memberTransactionFormSchema),
    defaultValues: selected
      ? {
          fromId: selected.fromId,
          toId: selected.toId || "",
          transactionType: selected.transactionType as any,
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
          transactionType: "FUNDS_TRANSFER",
          method: "ACCOUNT",
          amount: 0,
          note: "",
          transactionAt: new Date(),
        },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetcher.delete(`/api/member/transaction/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["member-transaction"],
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
      fetcher.post("/api/member/transaction", {
        body: { createdAt: selected?.transactionAt, ...body },
      }),
    onSuccess: async () => {
      if (selected && selected?.id) {
        await deleteMutation.mutateAsync(selected.id);
      }

      if (selected) {
        toast.success("Member transaction successfully updated!");
      } else {
        toast.success("Member transaction successfully added!");
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

  async function onSubmit(variables: MemberTransactionFormSchema) {
    return await mutation.mutateAsync(variables as any);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-2xl space-y-4"
      >
        <Box preset={"grid-split"}>
          <FormField
            control={form.control}
            name="fromId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From</FormLabel>
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

          <FormField
            control={form.control}
            name="toId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To</FormLabel>
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
                      {Object.entries(memberTransactionTypeMap).map(
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
        <GenericModalFooter
          actionLabel={selected ? "Update" : "Add"}
          onCancel={onCancel}
          isSubmitting={form.formState.isSubmitting || mutation.isPending}
        />
      </form>
    </Form>
  );
}
