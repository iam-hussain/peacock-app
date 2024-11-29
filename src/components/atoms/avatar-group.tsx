"use client";

import { useRouter } from "next/navigation";
import { FaCircle } from "react-icons/fa";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function AvatarGroup({
  className,
  link,
  src,
  name,
  active,
  isSmall = false,
  isLarge = false,
}: {
  className?: string | null;
  link?: string | null;
  src: string;
  name: string;
  active?: boolean;
  isSmall?: boolean;
  isLarge?: boolean;
}) {
  const router = useRouter();
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

  const clickHandler = () => {
    if (link) {
      router.push(link);
    }
  };

  return (
    <div
      className={cn("relative", className, {
        "cursor-pointer": link,
      })}
      onClick={clickHandler}
      data-link={link || ""}
    >
      <Avatar className={cn({ "h-6 w-6": isSmall, "h-20 w-20": isLarge })}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback className={cn({ "text-[0.6rem]": isSmall })}>
          {fallback}
        </AvatarFallback>
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
