"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  offsetFormSchema,
  OffsetFromSchema,
} from "../../../lib/validators/form-schema";
import { GenericModalFooter } from "../../atoms/generic-modal";
import Box from "../../ui/box";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import fetcher from "@/lib/core/fetcher";

type OffsetFormProps = {
  passbookId: string;
  joiningOffset?: number;
  delayOffset?: number;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function OffsetForm({
  passbookId,
  joiningOffset,
  delayOffset,
  onSuccess,
  onCancel,
}: OffsetFormProps) {
  const form = useForm({
    resolver: zodResolver(offsetFormSchema),
    defaultValues: {
      joiningOffset: joiningOffset || 0,
      delayOffset: delayOffset || 0,
    },
  });
  const { control, handleSubmit, reset } = form;

  const mutation = useMutation({
    mutationFn: (body: any) => fetcher.post("/api/account/offset", { body }),
    onSuccess: async (data) => {
      toast.success("Member adjustments updated successfully");
      if (!data) reset(data); // Reset form after submission
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

  async function onSubmit(variables: OffsetFromSchema) {
    return await mutation.mutateAsync({ passbookId, ...variables } as any);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-2xl space-y-4"
      >
        <Box preset={"stack-center"}>
          <Box className="w-full">
            {/* Amount Input */}
            <FormField
              control={control}
              name="joiningOffset"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Late Join Adjustment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount to reduce loan profit"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Box>

          <Box className="w-full">
            {/* Amount Input */}
            <FormField
              control={control}
              name="delayOffset"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Delayed Payment Adjustment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount to reduce loan profit"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Box>
        </Box>

        <GenericModalFooter
          actionLabel={"Update Adjustments"}
          onCancel={onCancel}
          isSubmitting={form.formState.isSubmitting || mutation.isPending}
        />
      </form>
    </Form>
  );
}
