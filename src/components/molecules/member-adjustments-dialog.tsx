"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

import fetcher from "@/lib/core/fetcher";
import { moneyFormat } from "@/lib/ui/utils";

const adjustmentsSchema = z.object({
  lateJoinAdjustment: z.number().min(0, "Amount must be positive"),
  delayedPaymentAdjustment: z.number().min(0, "Amount must be positive"),
});

type AdjustmentsFormData = z.infer<typeof adjustmentsSchema>;

interface MemberAdjustmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  passbookId: string;
  currentLateJoin?: number;
  currentDelayedPayment?: number;
  onSuccess?: () => void;
}

export function MemberAdjustmentsDialog({
  open,
  onOpenChange,
  memberId: _memberId,
  memberName,
  passbookId,
  currentLateJoin = 0,
  currentDelayedPayment = 0,
  onSuccess,
}: MemberAdjustmentsDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<AdjustmentsFormData>({
    resolver: zodResolver(adjustmentsSchema),
    defaultValues: {
      lateJoinAdjustment: currentLateJoin,
      delayedPaymentAdjustment: currentDelayedPayment,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: AdjustmentsFormData) =>
      fetcher.post("/api/account/offset", {
        body: {
          passbookId,
          joiningOffset: data.lateJoinAdjustment,
          delayOffset: data.delayedPaymentAdjustment,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["all"] });
      toast.success("Member adjustments updated successfully");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  const totalAdjustment =
    form.watch("lateJoinAdjustment") + form.watch("delayedPaymentAdjustment");

  async function onSubmit(data: AdjustmentsFormData) {
    await mutation.mutateAsync(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Member Adjustments – {memberName}</DialogTitle>
          <DialogDescription>
            Update late join and delayed payment adjustment amounts for this
            member.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="lateJoinAdjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Late Join Adjustment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Adjustment amount for joining the club after the start date.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="delayedPaymentAdjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delayed Payment Adjustment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Adjustment amount for delayed monthly payments.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total Adjustment Summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Adjustment:</span>
                <span className="font-semibold text-foreground">
                  {moneyFormat(totalAdjustment)}
                </span>
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? "Updating..." : "Update Adjustments"}
              </button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
