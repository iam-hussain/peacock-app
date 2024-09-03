"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { GenericModalFooter } from "../../atoms/generic-modal";
import Box from "../../ui/box";
import { useQuery } from "@tanstack/react-query";
import { fetchVendorConnection } from "@/lib/query-options";

type VendorConnectionsFormProps = {
  vendorId: string;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function VendorConnectionsForm({
  vendorId,
  onSuccess,
  onCancel,
}: VendorConnectionsFormProps) {
  const { control, handleSubmit, reset, formState } = useForm();
  const { data, isLoading, isError } = useQuery(
    fetchVendorConnection(vendorId),
  );

  useEffect(() => {
    if (data && data.connections) {
      reset({ connections: data.connections });
    }
  }, [data, vendorId, reset]);

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/vendor/connection/${vendorId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data.connections),
      });

      if (!response.ok) throw new Error("Failed to update connections");

      toast.success("Connections updated successfully");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Failed to update connections");
    }
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
    <form onSubmit={handleSubmit(onSubmit)} className="py-2">
      <Box preset={"grid-split"} className="gap-2">
        {data?.connections.map((connection, index) => (
          <div
            key={connection.id}
            className="flex w-full items-center justify-between border border-input px-2 min-h-[36px] py-1 rounded-md"
          >
            <span className="truncate text-[14px] pr-1">{`${connection.member.firstName} ${connection.member.lastName}`}</span>
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
        isSubmitting={formState.isSubmitting}
      />
    </form>
  );
}
