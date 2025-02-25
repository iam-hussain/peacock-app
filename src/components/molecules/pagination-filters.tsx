"use client";

import React from "react";
import { HiMiniViewColumns } from "react-icons/hi2";
import { PiColumnsFill } from "react-icons/pi";

import { SelectInputGroup } from "../atoms/select-input-group";
import { Toggle } from "../ui/toggle";

type PaginationFiltersProps = {
  limit: number;
  onLimitChange: (value: number) => void;
  onToggleChange: (value: boolean) => void;
  toggleState: boolean;
};

export const PaginationFilters = ({
  limit,
  onLimitChange,
  onToggleChange,
  toggleState,
}: PaginationFiltersProps) => (
  <>
    <div className="flex justify-end gap-2 col-span-2 md:col-span-1">
      <SelectInputGroup
        value={limit}
        onChange={(value: number | string) => onLimitChange(Number(value))}
        placeholder="Per page"
        defaultValue="10"
        noPlaceHolderValue={true}
        options={[
          ["10", "10/page"],
          ["20", "20/page"],
          ["30", "30/page"],
          ["40", "40/page"],
          ["50", "50/page"],
          ["100", "100/page"],
        ]}
      />
      <Toggle
        aria-label="Toggle"
        onPressedChange={onToggleChange}
        variant={"outline"}
        className="gap-2"
      >
        {toggleState ? (
          <HiMiniViewColumns className="w-6 h-6" />
        ) : (
          <PiColumnsFill className="w-6 h-6" />
        )}
      </Toggle>
    </div>
    {/* <div className="flex justify-between md:justify-start gap-2 col-span-2 lg:col-span-1 flex-row-reverse"> */}
    {/* <Button onClick={onReset} variant={"outline"} className="w-auto">
        Clear
      </Button> */}

    {/* </div> */}
  </>
);
