import { cva, VariantProps } from "class-variance-authority";
import clsx from "clsx";
import React from "react";

import { cn } from "@/lib/utils";

const typographyStyles = cva("w-auto text-foreground", {
  variants: {
    variant: {
      body: "text-base",
      h1: "text-5xl font-bold",
      h2: "text-4xl font-bold",
      h3: "text-2xl font-semibold tracking-tight",
      h4: "text-xl font-normal tracking-tight",
      h6: "text-sm font-semibold",
      sub: "text-sm text-foreground/80",
      error: "text-[0.8rem] font-medium mt-1 text-destructive",
      caption: "text-xl font-medium",
      brand: "font-brand text-4xl uppercase tracking-normal sm:text-5xl",
      overline: "text-xs uppercase tracking-wide",
      blockquote: "mt-6 border-l-2 pl-6 italic",
      link: "font-medium text-primary underline underline-offset-4",
      listItem: "my-6 ml-6 list-disc",
      table: "my-6 w-full overflow-y-auto",
      tableCell: "border px-4 py-2 text-left",
    },
    align: {
      default: "",
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    },
    color: {
      default: "",
      primary: "text-primary",
      secondary: "text-secondary",
      accent: "text-accent",
      danger: "text-danger",
      warning: "text-warning",
      info: "text-info",
      success: "text-success",
      light: "text-foreground/80",
    },
  },
  defaultVariants: {
    variant: "body",
    align: "default",
    color: "default",
  },
});

interface TypographyProps extends VariantProps<typeof typographyStyles> {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}

const Typography: React.FC<TypographyProps> = ({
  as: Component = "p",
  className,
  children,
  ...props
}) => {
  return (
    <Component className={cn(clsx(typographyStyles(props), className))}>
      {children}
    </Component>
  );
};

export default Typography;
