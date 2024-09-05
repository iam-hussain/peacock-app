// TableComponents.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";

import { Column } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { LuClipboardEdit } from "react-icons/lu";

import { AvatarGroup } from "./avatar-group";
import { FaSortAmountDown, FaSortAmountDownAlt } from "react-icons/fa";

type AvatarCellProps = {
  id: string;
  avatar?: string;
  name: string;
  active?: boolean;
  subLabel?: string;
  avatarName?: string
};

export const AvatarCell = ({
  id,
  avatar,
  name,
  active,
  subLabel,
  avatarName,
}: AvatarCellProps) => (
  <div className="flex items-center space-x-2 min-w-[170px]" data-id={id}>
    <AvatarGroup src={avatar || ""} name={avatarName || name} active={active || false} />
    <div className="flex flex-col">
      <p className="text-foreground font-medium">{name}</p>
      {subLabel && (
        <p className="text-[0.7rem] text-foreground/70">{subLabel}</p>
      )}
    </div>
  </div>
);

type TableHeaderProps = {
  label: string;
  className?: string;
};

export const PlainTableHeader = ({ label, className }: TableHeaderProps) => (
  <div
    className={cn(
      "text-xs uppercase hover:bg-transparent hover:font-extrabold px-2",
      className,
    )}
  >
    {label}
  </div>
);

export const ActionTableHeader = ({
  label,
  column,
  onClick,
  className,
}: TableHeaderProps & {
  column: Column<any>;
  onClick?: (id: any) => void;
  className?: string;
}) => {
  const isSorted = column.getIsSorted();
  const isSortedAsc = isSorted === "asc";
  const isSortedDesc = isSorted === "desc";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() =>
        onClick
          ? onClick(column.id)
          : column.toggleSorting(column.getIsSorted() === "asc")
      }
      className={cn(
        "uppercase hover:bg-transparent hover:font-extrabold px-2 flex gap-2 justify-center align-middle items-center shadow-sm",
        isSorted && "border rounded-md", // Highlight when sorted
        className,
      )}
    >
      <span className="">{label}</span>
      <span
        data-id="sort_icon"
        className={cn(
          "ml-2 h-auto w-4 transition-transform duration-300 ease-in-out sort_icon",
          isSorted && "rotate-180", // Rotate when sorted in ascending order
        )}
      >
        {isSortedAsc ? (
          <FaSortAmountDown className="transition-opacity duration-300 opacity-100" />
        ) : isSortedDesc ? (
          <FaSortAmountDownAlt className="transition-opacity duration-300 opacity-100" />
        ) : (
          <FaSortAmountDownAlt className="transition-opacity duration-300 opacity-50" /> // Default state
        )}
      </span>
    </Button>
  );
};

type CommonTableCellProps = {
  label: string;
  subLabel?: string;
  className?: string;
  greenLabel?: boolean;
};

export const CommonTableCell = ({
  label,
  subLabel,
  className,
  greenLabel = false,
}: CommonTableCellProps) => (
  <div className={cn("flex flex-col items-start", className)}>
    <p
      className={cn("text-foreground font-medium", {
        "text-emerald-500": greenLabel,
      })}
    >
      {label}
    </p>
    {subLabel && (
      <p className="text-[0.8rem] text-foreground/70 m-0">{subLabel}</p>
    )}
  </div>
);

type ActionCellProps = {
  onClick: () => void;
};

export const ActionCell = ({ onClick }: ActionCellProps) => (
  <Button variant={"ghost"} className="px-3 py-1" onClick={onClick}>
    <LuClipboardEdit className="h-4 w-4" />
  </Button>
);

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  setPage: (page: number) => void;
};

export const PaginationControls = ({
  page,
  totalPages,
  isLoading,
  isError,
  setPage,
}: PaginationControlsProps) => (
  <div className="mt-4 flex justify-between align-middle items-center gap-4">
    <Button
      onClick={() => setPage(page - 1)}
      disabled={page === 1 || isLoading || isError}
      variant={"outline"}
      className="min-w-[100px]"
    >
      Previous
    </Button>
    <span className="text-sm text-foreground/90">
      Page {page} of {totalPages}
    </span>
    <Button
      onClick={() => setPage(page + 1)}
      disabled={page === totalPages || isLoading || isError}
      variant={"outline"}
      className="min-w-[100px]"
    >
      Next
    </Button>
  </div>
);
