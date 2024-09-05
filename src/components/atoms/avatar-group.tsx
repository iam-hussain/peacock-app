import { FaCircle } from "react-icons/fa";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function AvatarGroup({
  src,
  name,
  active,
}: {
  src: string;
  name: string;
  active?: boolean;
}) {
  const nameArr = name
    .replace(/[^\w\s]/gi, "")
    .trim()
    .split(" ");
  const fallback =
    nameArr.length >= 2
      ? nameArr
          .map((e) => e.slice(0, 1))
          .join("")
          .slice(0, 3)
      : name.slice(0, 2);
  return (
    <div className="relative">
      <Avatar>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {active !== undefined && (
        <FaCircle
          className={cn("h-2 w-2 absolute -top-0.5 -right-0.5", {
            "text-primary": active,
            "text-destructive": !active,
          })}
        />
      )}
    </div>
  );
}
