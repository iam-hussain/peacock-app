import { cva, VariantProps } from "class-variance-authority";
import clsx from "clsx";
import React from "react";

import { cn } from "@/lib/utils";

const boxStyles = cva("w-full", {
  variants: {
    preset: {
      "row-center": "flex flex-row justify-center items-center",
      "row-start": "flex flex-row justify-start items-center",
      "row-responsive":
        "flex md:flex-row flex-col justify-start items-center md:items-start",
      "row-space-between": "flex flex-row justify-between items-center",
      "stack-center": "flex flex-col justify-center items-center",
      "stack-start": "flex flex-col justify-start items-start",
      "stack-responsive":
        "flex md:flex-col flex-row justify-start items-center w-auto",
      "stack-top-center": "flex flex-col justify-start items-center",
      "grid-center": "grid justify-center items-center",
      "grid-top-center": "grid justify-start items-center",
      "grid-cols-12": "grid grid-cols-12",
      "grid-split": "grid md:grid-cols-2 grid-cols-1",
    },
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      4: "gap-4",
      6: "gap-6",
      8: "gap-8",
      10: "gap-10",
    },
    variant: {
      none: "",
      page: "max-w-6xl w-full h-full p-4 md:p-6 mx-auto",
    },
  },
  defaultVariants: {
    preset: "row-center",
    gap: 4,
    variant: "none",
  },
});

interface BoxProps extends VariantProps<typeof boxStyles> {
  className?: string;
  children: React.ReactNode;
}

const Box: React.FC<BoxProps> = ({
  children,
  className,
  preset,
  gap,
  variant,
  ...props
}) => {
  return (
    <div
      data-name={"box"}
      className={cn(clsx(boxStyles({ preset, variant, gap }), className))}
      {...props}
    >
      {children}
    </div>
  );
};

export default Box;
