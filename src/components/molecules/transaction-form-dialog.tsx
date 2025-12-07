"use client";

import { TransactionDeleteForm } from "../organisms/forms/transaction-delete-form";
import { TransactionForm } from "../organisms/forms/transaction-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

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
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selected ? "Update Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>
        {selected && selected.id ? (
          <Tabs defaultValue="update" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="update">Update</TabsTrigger>
              <TabsTrigger value="delete">Delete</TabsTrigger>
            </TabsList>
            <TabsContent value="update">
              <TransactionForm
                accounts={accounts}
                selected={selected as any}
                onSuccess={handleSuccess}
                onCancel={handleSuccess}
              />
            </TabsContent>
            <TabsContent value="delete">
              <TransactionDeleteForm
                transaction={selected as any}
                onSuccess={handleSuccess}
                onCancel={handleSuccess}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <TransactionForm
            accounts={accounts}
            selected={selected as any}
            onSuccess={handleSuccess}
            onCancel={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
