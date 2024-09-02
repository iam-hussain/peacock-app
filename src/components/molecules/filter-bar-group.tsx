"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import Box from "@/components/ui/box";
import { TiUserAdd } from "react-icons/ti";
import { DialogTrigger } from "@/components/ui/dialog";
import { IconType } from "react-icons/lib";
import { PiColumnsFill } from "react-icons/pi";
import { HiMiniViewColumns } from "react-icons/hi2";
import { IoCamera } from "react-icons/io5";

type FilterBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onToggleChange: (value: boolean) => void;
  toggleState: boolean;
  onAddClick: () => void;
  toggleIcons?: { TrueIcon: IconType; FalseIcon: IconType };
  searchPlaceholder?: string;
  children?: React.ReactNode;
  onCapture?: () => void;
};

export const FilterBar = ({
  children,
  onCapture,
  searchValue,
  onSearchChange,
  onToggleChange,
  toggleState,
  onAddClick,
  toggleIcons,
  searchPlaceholder = "Filter names...",
}: FilterBarProps) => {
  const { TrueIcon = HiMiniViewColumns, FalseIcon = PiColumnsFill } =
    toggleIcons || {};

  return (
    <div className="flex justify-between mb-4 gap-3 px-2">
      <Input
        type="text"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        className="max-w-sm"
      />
      <Box className="w-auto gap-2 sm:gap-4">
        {children}
        {onCapture && (
          <Button onClick={onCapture} size="icon" variant={"outline"}>
            <IoCamera className="w-6 h-6" />
          </Button>
        )}

        <Toggle
          aria-label="Toggle"
          variant={"outline"}
          onPressedChange={onToggleChange}
          className="gap-2"
        >
          {toggleState ? (
            <TrueIcon className="w-6 h-6" />
          ) : (
            <FalseIcon className="w-6 h-6" />
          )}
        </Toggle>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" onClick={onAddClick}>
            <TiUserAdd className="w-6 h-6" />
          </Button>
        </DialogTrigger>
      </Box>
    </div>
  );
};
