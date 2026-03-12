/**
 * Luxury UI utilities for The Peacock Club
 */

/** Haptic feedback patterns for mobile */
export const haptics = {
  confirm: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(15);
    }
  },
  celebrate: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  alert: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(30);
    }
  },
};

/** Member tier based on join date */
export type MemberTier = "founding" | "senior" | "standard";

export function getMemberTier(joinDate: Date | string): MemberTier {
  const joined = new Date(joinDate);
  const now = new Date();
  const yearsDiff =
    (now.getTime() - joined.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  // Founding members joined in 2020
  if (joined.getFullYear() <= 2020) return "founding";
  // Senior members: 2+ years
  if (yearsDiff >= 2) return "senior";
  return "standard";
}

/** Get tier-specific styles */
export function getTierStyles(tier: MemberTier) {
  switch (tier) {
    case "founding":
      return {
        ring: "ring-2 ring-primary/60 animate-glow-pulse",
        badge: "bg-primary/20 text-primary border border-primary/30",
        greeting: (name: string) => `The Club welcomes you, ${name}`,
        label: "Founding Member",
      };
    case "senior":
      return {
        ring: "ring-2 ring-primary/40",
        badge: "bg-primary/10 text-primary border border-primary/20",
        greeting: (name: string) => `Good evening, ${name}`,
        label: "Senior Member",
      };
    default:
      return {
        ring: "ring-1 ring-primary/20",
        badge: "bg-muted text-muted-foreground",
        greeting: (name: string) => `Welcome, ${name}`,
        label: "Member",
      };
  }
}
