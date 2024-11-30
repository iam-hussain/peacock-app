import { ReactElement } from "react";

import { Card, CardContent } from "../ui/card";

import { cn } from "@/lib/utils";

// DashboardCard Component with Icon
export function DashboardCard({
  title,
  value,
  icon,
  className,
  useRed,
  useGreen,
}: {
  title: string;
  value: string | number;
  icon?: ReactElement<any, any>;
  className?: string;
  useRed?: boolean;
  useGreen?: boolean;
}) {
  return (
    <Card className={cn("shadow-sm flex items-center rounded-lg", className)}>
      <CardContent className="p-4 flex space-x-4">
        {icon && icon}
        <div>
          <h3 className={"text-sm text-gray-500"}>{title}</h3>
          <p
            className={cn("text-xl font-bold tracking-wide", {
              "text-red-600": useRed,
              "text-green-600": useGreen,
            })}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
