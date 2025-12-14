import React from "react";
import { FaCircle } from "react-icons/fa";

import { cn } from "@/lib/ui/utils";

const icons = {
  FaCircle,
};

export type IconKey = keyof typeof icons;

export interface IconProps extends React.SVGAttributes<SVGAElement> {
  name: IconKey;
}

const Icon = ({ name, ...props }: IconProps) => {
  const IconComp = icons[name];
  return <IconComp {...props} className={cn(props.className || "h-4 w-4")} />;
};

Icon.displayName = "Icon";

export default Icon;
