// TableComponents.tsx
"use client";

import { Column } from "@tanstack/react-table";
import React from "react";
import { FaSortAmountDown, FaSortAmountDownAlt } from "react-icons/fa";
import { LuClipboardPenLine } from "react-icons/lu";

import { AvatarGroup } from "./avatar-group";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/utils";

type AvatarCellProps = {
  id: string;
  link?: string | null;
  avatar?: string | null;
  name: string;
  active?: boolean;
  subLabel?: string | null;
  avatarName?: string | null;
  className?: string;
  isSmall?: boolean;
};

export const ActionCell = ({ onClick }: ActionCellProps) => (
  <Button variant={"ghost"} className="px-3 py-1" onClick={onClick}>
    <LuClipboardPenLine className="h-4 w-4" />
  </Button>
);

type TableHeaderProps = { label: string; className?: string };

export const ActionTableHeader = ({
  label,
  column,
  onClick,
  className,
}: TableHeaderProps & {
  column: Column<any>;
  onClick?: (id: string) => void;
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
        className
      )}
    >
      <span className="">{label}</span>
      <span
        data-id="sort_icon"
        className={cn(
          "ml-2 h-auto w-4 transition-transform duration-300 ease-in-out sort_icon"
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

export const AvatarCell = ({
  id,
  avatar,
  link,
  name,
  active,
  subLabel,
  avatarName,
  className,
  isSmall = false,
}: AvatarCellProps) => (
  <div
    className={cn("flex items-center space-x-2 min-w-[170px]", className)}
    data-id={id}
  >
    <AvatarGroup
      src={avatar || ""}
      link={link || null}
      name={avatarName || name}
      active={active || false}
      isSmall={isSmall}
    />
    <div className="flex flex-col">
      <p
        className={cn("text-foreground font-medium", {
          "text-[0.8rem]": isSmall,
        })}
      >
        {name}
      </p>
      {subLabel && (
        <p className="text-[0.7rem] text-foreground/70">{subLabel}</p>
      )}
    </div>
  </div>
);

type CommonTableCellProps = {
  label: string;
  subLabel?: string;
  className?: string;
  greenLabel?: boolean;
  redLabel?: boolean;
};

export const CommonTableCell = ({
  label,
  subLabel,
  className,
  greenLabel = false,
  redLabel = false,
}: CommonTableCellProps) => (
  <div className={cn("flex flex-col items-start", className)}>
    <p
      className={cn("text-foreground font-medium", {
        "text-emerald-500": greenLabel,
        "text-rose-500": redLabel,
      })}
    >
      {label}
    </p>
    {subLabel && (
      <p className="text-[0.8rem] text-foreground/70 m-0">{subLabel}</p>
    )}
  </div>
);

type ActionCellProps = { onClick: () => void };

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

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  setPage: (page: number) => void;
};

export const PlainTableHeader = ({ label, className }: TableHeaderProps) => (
  <div
    className={cn(
      "text-xs uppercase hover:bg-transparent hover:font-extrabold px-2",
      className
    )}
  >
    {label}
  </div>
);
