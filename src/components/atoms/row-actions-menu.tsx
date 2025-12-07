"use client";

import {
  Edit,
  Eye,
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
  onAddRepayment?: () => void;
  onAdjustOffset?: () => void;
}

export function RowActionsMenu({
  onViewDetails,
  onEdit,
  onViewTransactions,
  onDeactivate,
  onRemove,
  onAddRepayment,
  onAdjustOffset,
}: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {onViewDetails && (
          <DropdownMenuItem onClick={onViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            View Loan
          </DropdownMenuItem>
        )}
        {onAddRepayment && (
          <DropdownMenuItem onClick={onAddRepayment}>
            <Receipt className="mr-2 h-4 w-4" />
            Add Repayment
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Loan
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
        {(onDeactivate || onRemove) && <DropdownMenuSeparator />}
        {onDeactivate && (
          <DropdownMenuItem onClick={onDeactivate} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Loan
          </DropdownMenuItem>
        )}
        {onRemove && (
          <DropdownMenuItem onClick={onRemove} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove Member
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
