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

/**
 * Format number in Indian format with Lakhs and Crores
 * @param value - The number to format
 * @param showCurrency - Whether to show ₹ symbol
 * @returns Formatted string (e.g., "₹1.5L" for 1,50,000 or "₹2.5Cr" for 2,50,00,000)
 */
export function formatIndianNumber(
  value: number,
  showCurrency: boolean = true
): string {
  const absValue = Math.abs(value)
  const prefix = value < 0 ? '-' : ''
  const currency = showCurrency ? '₹' : ''

  if (absValue >= 10000000) {
    // Crores (1,00,00,000)
    const crores = absValue / 10000000
    return `${prefix}${currency}${crores.toFixed(1)}Cr`
  } else if (absValue >= 100000) {
    // Lakhs (1,00,000)
    const lakhs = absValue / 100000
    return `${prefix}${currency}${lakhs.toFixed(1)}L`
  } else if (absValue >= 1000) {
    // Thousands
    const thousands = absValue / 1000
    return `${prefix}${currency}${thousands.toFixed(1)}K`
  } else {
    return `${prefix}${currency}${absValue.toLocaleString('en-IN')}`
  }
}
