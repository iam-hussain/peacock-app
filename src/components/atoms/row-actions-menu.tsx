"use client";

import {
  Edit,
  Key,
  MoreHorizontal,
  Receipt,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface RowActionsMenuProps {
  onViewDetails?: () => void;
  onEdit?: () => void;
  onViewTransactions?: () => void;
  onDeactivate?: () => void;
  onRemove?: () => void;
  onDelete?: () => void;
  onAddRepayment?: () => void;
  onAdjustOffset?: () => void;
  onChangePassword?: () => void;
  onResetPassword?: () => void;
}

export function RowActionsMenu({
  onEdit,
  onViewTransactions,
  onDeactivate,
  onRemove,
  onAddRepayment,
  onAdjustOffset,
  onChangePassword,
  onResetPassword,
  onDelete,
}: RowActionsMenuProps) {
  // Check if there are any actions available
  const hasActions = !!(
    onEdit ||
    onViewTransactions ||
    onDeactivate ||
    onRemove ||
    onAddRepayment ||
    onAdjustOffset ||
    onChangePassword ||
    onResetPassword ||
    onDelete
  );

  // Don't render if no actions are available
  if (!hasActions) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {onAddRepayment && (
          <DropdownMenuItem onClick={onAddRepayment}>
            <Receipt className="mr-2 h-4 w-4" />
            Add Repayment
          </DropdownMenuItem>
        )}
        {onViewTransactions && (
          <DropdownMenuItem onClick={onViewTransactions}>
            <Receipt className="mr-2 h-4 w-4" />
            View Transactions
          </DropdownMenuItem>
        )}
        {onAdjustOffset && (
          <DropdownMenuItem onClick={onAdjustOffset}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Adjustments
          </DropdownMenuItem>
        )}
        {onResetPassword && (
          <DropdownMenuItem onClick={onResetPassword}>
            <Key className="mr-2 h-4 w-4" />
            Reset Password
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {(onDeactivate || onRemove || onDelete) && <DropdownMenuSeparator />}
        {onDeactivate && (
          <DropdownMenuItem onClick={onDeactivate} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        )}
        {onRemove && (
          <DropdownMenuItem onClick={onRemove} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove Member
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
