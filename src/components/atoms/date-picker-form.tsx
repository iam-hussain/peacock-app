"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import React from "react";

import { FormControl } from "../ui/form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerFormProps = {
  field: any;
  placeholder: string;
};

export const DatePickerForm = ({ placeholder, field }: DatePickerFormProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <FormControl>
        <Button
          variant={"outline"}
          className={cn(
            "w-full pl-3 text-left font-normal",
            !field.value && "text-muted-foreground"
          )}
        >
          {field.value ? (
            format(field.value, "PPP")
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </FormControl>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={field.value}
        onSelect={field.onChange}
        initialFocus={true}
        defaultMonth={field.value}
      />
    </PopoverContent>
  </Popover>
);
