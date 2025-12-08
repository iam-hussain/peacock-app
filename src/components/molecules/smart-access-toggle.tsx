"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Switch } from "../ui/switch";

import fetcher from "@/lib/fetcher";

interface SmartAccessToggleProps {
  memberId: string;
  memberName: string;
  currentRead: boolean;
  currentWrite: boolean;
  currentAdmin: boolean;
  accessType: "read" | "write" | "admin";
  disabled?: boolean;
  onStateChange?: (newState: {
    read: boolean;
    write: boolean;
    admin: boolean;
  }) => void;
  showTooltip?: boolean;
}

export function SmartAccessToggle({
  memberId,
  memberName,
  currentRead,
  currentWrite,
  currentAdmin,
  accessType,
  disabled = false,
  onStateChange,
  showTooltip: _showTooltip = false,
}: SmartAccessToggleProps) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticState, setOptimisticState] = useState<{
    read: boolean;
    write: boolean;
    admin: boolean;
  } | null>(null);

  // Get current value based on access type
  const getCurrentValue = () => {
    if (optimisticState) {
      return optimisticState[accessType];
    }
    if (accessType === "read") return currentRead;
    if (accessType === "write") return currentWrite;
    return currentAdmin;
  };

  // Calculate new state based on rules
  const calculateNewState = (
    toggledValue: boolean
  ): {
    read: boolean;
    write: boolean;
    admin: boolean;
  } => {
    let newRead = currentRead;
    let newWrite = currentWrite;
    let newAdmin = currentAdmin;

    // Apply the toggle
    if (accessType === "read") {
      newRead = toggledValue;
    } else if (accessType === "write") {
      newWrite = toggledValue;
    } else {
      newAdmin = toggledValue;
    }

    // Apply rules
    if (accessType === "admin") {
      // Admin ON → Read ON, Write ON
      if (toggledValue) {
        newRead = true;
        newWrite = true;
      }
      // Admin OFF → keep Read/Write as is
    } else if (accessType === "write") {
      // Write ON → Read ON, Admin OFF
      if (toggledValue) {
        newRead = true;
        newAdmin = false;
      }
      // Write OFF → keep Read as is
    } else if (accessType === "read") {
      // Read ON → Write OFF (unless explicitly set), Admin OFF
      if (toggledValue) {
        // If turning Read ON, turn Write and Admin OFF
        newWrite = false;
        newAdmin = false;
      } else {
        // Read OFF → Write OFF, Admin OFF
        newWrite = false;
        newAdmin = false;
      }
    }

    return { read: newRead, write: newWrite, admin: newAdmin };
  };

  const permissionMutation = useMutation({
    mutationFn: (newState: { read: boolean; write: boolean; admin: boolean }) =>
      fetcher.patch(`/api/admin/members/${memberId}/access`, {
        body: {
          readAccess: newState.read,
          writeAccess: newState.write,
          role: newState.admin ? "ADMIN" : "MEMBER",
        },
      }),
    onSuccess: async (_data, _variables) => {
      await queryClient.invalidateQueries({ queryKey: ["all"] });
      toast.success("Access updated successfully");
      setIsUpdating(false);
      setOptimisticState(null);
      // State will be updated via query invalidation, no need to call onStateChange here
    },
    onError: (error: any) => {
      console.error("Access update error:", error);
      // Extract error message from various possible error formats
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        error?.toString() ||
        "Unknown error";
      toast.error(`Couldn't update access for ${memberName}. ${errorMessage}`);
      setIsUpdating(false);
      setOptimisticState(null);
    },
  });

  const handleToggle = (value: boolean) => {
    const newState = calculateNewState(value);

    // Set optimistic state
    setOptimisticState(newState);
    setIsUpdating(true);

    // Notify parent of state change for immediate UI update
    if (onStateChange) {
      onStateChange(newState);
    }

    // Make API call
    permissionMutation.mutate(newState);
  };

  const currentValue = getCurrentValue();

  // Determine if this toggle should be disabled due to rules
  const isRuleDisabled = () => {
    if (accessType === "read") {
      // Read cannot be turned off if Admin or Write is ON (they require Read)
      return (currentAdmin || currentWrite) && currentValue;
    } else if (accessType === "write") {
      // Write cannot be turned off if Admin is ON (Admin includes Write)
      return currentAdmin && currentValue;
    }
    // Admin can always be toggled
    return false;
  };

  const ruleDisabled = isRuleDisabled();

  return (
    <div className="flex items-center justify-center">
      <Switch
        checked={currentValue}
        onCheckedChange={handleToggle}
        disabled={disabled || isUpdating || ruleDisabled}
      />
    </div>
  );
}
