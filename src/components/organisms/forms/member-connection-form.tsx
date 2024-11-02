"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { GenericModalFooter } from "../../atoms/generic-modal";
import Box from "../../ui/box";

import { AvatarCell } from "@/components/atoms/table-component";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import fetcher from "@/lib/fetcher";
import { memberConnectionFormSchema } from "@/lib/form-schema";
import { fetchMemberConnection } from "@/lib/query-options";

type MemberConnectionsFormProps = {
  memberId: string;
  onSuccess: () => void;
  onCancel?: () => void;
};

// Define the types based on Zod schema for better type inference
type MemberConnectionsFormData = {
  loanOffset: number;
  connections: { id: string; active: boolean }[];
};

export function MemberConnectionsForm({
  memberId,
  onSuccess,
  onCancel,
}: MemberConnectionsFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<MemberConnectionsFormData>({
    resolver: zodResolver(memberConnectionFormSchema),
    defaultValues: {
      loanOffset: 0,
      connections: [],
    },
  });

  const { control, handleSubmit, reset, formState } = form;

  const { data, isLoading, isError } = useQuery(
    fetchMemberConnection(memberId)
  );

  useEffect(() => {
    if (data && data.connections) {
      reset({
        loanOffset: data.loanOffset || 0,
        connections: data.connections.map((connection) => ({
          id: connection.id,
          active: connection.active,
        })),
      });
    }
  }, [data, memberId, reset]);

  const mutation = useMutation({
    mutationFn: (input: MemberConnectionsFormData) =>
      fetcher.post(`/api/member/connection/${memberId}`, {
        body: {
          connections: input.connections,
          current: data?.loanOffset || 0,
          loanOffset: input.loanOffset,
          loanPassbookId: data?.loanPassbookId,
        },
      }),
    onSuccess: async (response) => {
      reset(response);
      await queryClient.invalidateQueries({ queryKey: ["member-connection"] });
      toast.success("Connections updated successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  const onSubmit = async (formData: MemberConnectionsFormData) => {
    await mutation.mutateAsync(formData);
  };

  if (isLoading) {
    return <p className="w-full text-center p-6">Loading...</p>;
  }

  if (isError) {
    return (
      <p className="w-full text-center p-6 text-destructive">
        Unexpected error on fetching the data
      </p>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
        <Box preset={"stack-center"}>
          <Box className="w-full">
            {/* Amount Input */}
            <FormField
              control={control}
              name="loanOffset"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Amount to reduce loan profit</FormLabel>
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
          <Separator />
          <Box preset={"row-center"} className="gap-2 flex-wrap w-full">
            {data?.connections.map((connection, index) => (
              <div
                key={connection.id}
                className="flex items-center justify-between border border-input px-2 min-h-[46px] py-1 rounded-md w-full sm:max-w-[225px]"
              >
                <AvatarCell
                  id={connection.id}
                  avatar={connection.memberAvatar}
                  name={connection.vendorName}
                  avatarName={connection.name}
                  active={connection.vendorActive}
                  subLabel={connection.memberName}
                  className="min-w-min"
                  isSmall={true}
                />
                <Controller
                  name={`connections.${index}.active` as const}
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      defaultChecked={connection.active}
                    />
                  )}
                />
              </div>
            ))}
          </Box>
        </Box>
        <GenericModalFooter
          actionLabel={"Save"}
          onCancel={onCancel}
          isSubmitting={formState.isSubmitting || mutation.isPending}
        />
      </form>
    </Form>
  );
}
