import { ReactElement } from "react";
import { Card, CardContent } from "../ui/card";

// DashboardCard Component with Icon
export function DashboardCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactElement<any, any>;
}) {
  return (
    <Card className="shadow-sm flex items-center rounded-lg">
      <CardContent className="p-4 flex space-x-4">
        {icon}
        <div>
          <h3 className="text-sm text-gray-500">{title}</h3>
          <p className="text-xl font-bold tracking-wide">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
