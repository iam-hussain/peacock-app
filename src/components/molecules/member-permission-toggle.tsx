"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Switch } from "../ui/switch";

import fetcher from "@/lib/fetcher";

interface MemberPermissionToggleProps {
  memberId: string;
  currentValue: boolean;
  permissionType: "canRead" | "canWrite" | "canLogin";
  disabled?: boolean;
}

export function MemberPermissionToggle({
  memberId,
  currentValue,
  permissionType,
  disabled = false,
}: MemberPermissionToggleProps) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const permissionMutation = useMutation({
    mutationFn: (value: boolean) =>
      fetcher.patch(`/api/admin/members/${memberId}/access`, {
        body: { [permissionType]: value },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["all"] });
      toast.success("Permissions updated successfully");
      setIsUpdating(false);
    },
    onError: (error: any) => {
      toast.error(
        error.message || "Failed to update permissions. Please try again."
      );
      setIsUpdating(false);
    },
  });

  const handleToggle = (value: boolean) => {
    setIsUpdating(true);
    permissionMutation.mutate(value);
  };

  return (
    <div className="flex items-center justify-center">
      <Switch
        checked={currentValue}
        onCheckedChange={handleToggle}
        disabled={disabled || isUpdating}
      />
    </div>
  );
}
