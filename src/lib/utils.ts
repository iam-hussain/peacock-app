import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function moneyFormat(amount: number) {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
}
