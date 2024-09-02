"use client";

import React, { ReactNode, useCallback } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { throttle } from "lodash";

type GenericModalFooterProps = {
  actionLabel: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  isDelete?: boolean;
  isSubmitting?: boolean;
};

export const GenericModalFooter = ({
  actionLabel,
  onCancel,
  onConfirm,
  isDelete,
  isSubmitting = false,
}: GenericModalFooterProps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledOnConfirm = useCallback(
    throttle(() => {
      if (onConfirm) {
        onConfirm();
      }
    }, 2000),
    [onConfirm],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledOnCancel = useCallback(
    throttle(() => {
      if (onCancel) {
        onCancel();
      }
    }, 2000),
    [onCancel],
  );

  return (
    <DialogFooter className="gap-2 flex sm:flex-row flex-row justify-between pt-4">
      <Button
        variant="outline"
        onClick={throttledOnCancel}
        className="min-w-[140px]"
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        type={isDelete ? "button" : "submit"}
        variant={isDelete ? "destructive" : "default"}
        className="min-w-[140px]"
        onClick={throttledOnConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : actionLabel}
      </Button>
    </DialogFooter>
  );
};

type GenericModalProps = {
  title: string;
  description?: string;
  disabled?: boolean;
  children: ReactNode;
  isDelete?: boolean;
};

export const GenericModal = ({
  title,
  description,
  children,
}: GenericModalProps) => {
  return (
    <DialogContent className="h-auto max-h-svh flex flex-col overflow-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="h-auto py-2">{children}</div>
    </DialogContent>
  );
};
