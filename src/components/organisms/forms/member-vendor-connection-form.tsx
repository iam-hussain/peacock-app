"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Box from "../../ui/box";
import { GenericModalFooter } from "../../atoms/generic-modal";

type VendorConnection = {
  id: string;
  vendor: { name: string };
  active: boolean;
};

type MemberVendorConnectionsFormProps = {
  memberId: string;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function MemberVendorConnectionsForm({
  memberId,
  onSuccess,
  onCancel,
}: MemberVendorConnectionsFormProps) {
  const { control, handleSubmit, reset, formState } = useForm();
  const [connections, setConnections] = useState<VendorConnection[]>([]);

  useEffect(() => {
    async function fetchConnections() {
      const response = await fetch(
        `/api/vendor-profit-share/member/${memberId}`,
      );
      const data = await response.json();
      setConnections(data.connections);
      reset({ connections: data.connections });
    }

    fetchConnections();
  }, [memberId, reset]);

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch(
        `/api/vendor-profit-share/member/${memberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data.connections),
        },
      );

      if (!response.ok) throw new Error("Failed to update connections");

      toast.success("Connections updated successfully");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Failed to update connections");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      {connections.length === 0 && (
        <p className="w-full text-center p-6">Loading...</p>
      )}
      <Box preset={"grid-split"} className="gap-2">
        {connections.map((connection, index) => (
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
        isSubmitting={formState.isSubmitting}
      />
    </form>
  );
}
