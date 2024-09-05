"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { GenericModalFooter } from "../../atoms/generic-modal";
import Box from "../../ui/box";

import { Switch } from "@/components/ui/switch";
import fetcher from "@/lib/fetcher";
import { fetchMemberConnection } from "@/lib/query-options";

type MemberConnectionsFormProps = {
  memberId: string;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function MemberConnectionsForm({
  memberId,
  onSuccess,
  onCancel,
}: MemberConnectionsFormProps) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, formState } = useForm();
  const { data, isLoading, isError } = useQuery(
    fetchMemberConnection(memberId)
  );

  useEffect(() => {
    if (data && data.connections) {
      reset({ connections: data.connections });
    }
  }, [data, memberId, reset]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      fetcher.post(`/api/member/connection/${memberId}`, {
        body: data.connections,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["connection"],
      });

      toast.success("Connections updated successfully");
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

  async function onSubmit(data: any) {
    return await mutation.mutateAsync(data);
  }

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      <Box preset={"grid-split"} className="gap-2">
        {data?.connections.map((connection, index) => (
          <div
            key={connection.id}
            className="flex w-full items-center justify-between border border-input px-2 min-h-[36px] py-1 rounded-md"
          >
            <span className="truncate text-[14px] pr-1">
              {connection.vendor.name}
            </span>
            <Controller
              name={`connections.${index}.active`}
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
      <GenericModalFooter
        actionLabel={"Save"}
        onCancel={onCancel}
        isSubmitting={formState.isSubmitting || mutation.isPending}
      />
    </form>
  );
}
