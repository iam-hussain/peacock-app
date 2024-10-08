"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerGroupProps = {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  placeholder: string;
};

export const DatePickerGroup = ({
  selectedDate,
  onSelectDate,
  placeholder,
}: DatePickerGroupProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !selectedDate && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {selectedDate ? (
          format(selectedDate, "PPP")
        ) : (
          <span>{placeholder}</span>
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        initialFocus={false}
        defaultMonth={selectedDate}
      />
    </PopoverContent>
  </Popover>
);
