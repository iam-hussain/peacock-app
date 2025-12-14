"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { TransactionForm } from "../organisms/forms/transaction-form";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";

import { TransformedAccountSelect } from "@/app/api/account/select/route";
import { TransformedTransaction } from "@/app/api/transaction/route";

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected?: TransformedTransaction | null;
  accounts: TransformedAccountSelect[];
  onSuccess?: () => void;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  selected,
  accounts,
  onSuccess,
}: TransactionFormDialogProps) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const isEditMode = selected && selected.id;
  const title = isEditMode ? "Update Transaction" : "Add Transaction";
  const description =
    "Record member deposits, withdrawals, transfers, loans, and vendor movements.";

  // Mobile: Drawer
  const mobileContent = (
    <div className="flex flex-col h-full">
      <DrawerHeader className="text-left border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <DrawerTitle className="text-xl font-semibold">{title}</DrawerTitle>
            <DrawerDescription className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </div>
      </DrawerHeader>

      <div className="flex-1 overflow-y-auto px-4 py-6 -mx-4">
        <div className="px-4">
          <TransactionForm
            accounts={accounts}
            selected={selected as any}
            onSuccess={handleSuccess}
            onCancel={handleSuccess}
            isMobile={true}
          />
        </div>
      </div>
      <DrawerFooter className="border-t pt-4 pb-safe px-4">
        <div className="text-xs text-muted-foreground text-center">
          Tap outside or swipe down to close
        </div>
      </DrawerFooter>
    </div>
  );

  // Desktop: Dialog
  const desktopContent = (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {description}
        </DialogDescription>
      </DialogHeader>
      <TransactionForm
        accounts={accounts}
        selected={selected as any}
        onSuccess={handleSuccess}
        onCancel={handleSuccess}
        isMobile={false}
      />
    </>
  );

  return (
    <>
      {!isDesktop && (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[96vh]">
            {mobileContent}
          </DrawerContent>
        </Drawer>
      )}

      {isDesktop && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[720px] max-h-[90vh] overflow-y-auto">
            {desktopContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
