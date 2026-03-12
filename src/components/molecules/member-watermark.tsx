"use client";

import { useAppState } from "@/components/providers/app-state-provider";

export default function MemberWatermark() {
  const { state } = useAppState();

  if (!state.isLoggedIn) return null;

  const initial = "P";

  const svgPattern = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <text x="60" y="65" text-anchor="middle" font-family="serif" font-size="24" fill="currentColor" opacity="0.03" transform="rotate(-30, 60, 60)">${initial}</text>
    </svg>
  `;

  const encodedSvg = encodeURIComponent(svgPattern.trim());

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `url("data:image/svg+xml,${encodedSvg}")`,
        backgroundRepeat: "repeat",
      }}
      aria-hidden="true"
    />
  );
}
