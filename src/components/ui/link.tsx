import { Slot, Slottable } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";
import Icon, { IconKey } from "./icon";
import { cva, type VariantProps } from "class-variance-authority";
import Link, { LinkProps } from "next/link";

const linkVariants = cva(
  "inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow no-touch:hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm no-touch:hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm no-touch:hover:bg-secondary/90",
        ghost: "no-touch:hover:bg-accent no-touch:hover:text-accent-foreground",
        menu: "no-touch:hover:bg-accent no-touch:hover:text-accent-foreground justify-start gap-4 text-foreground/80 w-full",
        transparent: "bg-transparent active:bg-bw border-0",
        link: "text-primary underline-offset-4 no-touch:hover:underline",
        accent:
          "bg-accent text-accent-foreground shadow-sm no-touch:hover:bg-accent/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-8 w-8 rounded-lg text-foreground/80",
        auto: "h-auto px-4 py-2",
        none: "h-auto w-auto p-0 m-0",
      },
      animation: {
        default: "",
        scale: "no-touch:hover:scale-110 active:scale-90",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "default",
    },
  },
);

type LinkVariantProps = VariantProps<typeof linkVariants>;

interface IconProps {
  iconName: IconKey;
  iconPlacement: "left" | "right";
}

interface IconRefProps {
  iconName?: IconKey;
  iconPlacement?: undefined;
}

export interface CustomLinkProps
  extends LinkProps,
    // React.AnchorHTMLAttributes<HTMLAnchorElement>,
    LinkVariantProps {
  asChild?: boolean;
  className?: string;
  children: any;
  onClick?: () => void;
}

export type LinkIconProps = IconProps | IconRefProps;

const CustomLink = React.forwardRef<
  HTMLAnchorElement,
  CustomLinkProps & LinkIconProps
>(
  (
    {
      className,
      variant,
      animation,
      size,
      asChild = false,
      iconName,
      iconPlacement = "left",
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : Link;

    return (
      <Comp
        className={cn(linkVariants({ variant, size, animation, className }))}
        ref={ref}
        {...(props as any)}
      >
        {iconName && iconPlacement === "left" && (
          <Icon className="w-5 h-5" name={iconName} />
        )}
        <Slottable>{children}</Slottable>
        {iconName && iconPlacement === "right" && (
          <Icon className="w-5 h-5" name={iconName} />
        )}
      </Comp>
    );
  },
);

CustomLink.displayName = "CustomLink";

export { CustomLink, linkVariants };
