"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAuthStatus } from "@/lib/query-options";

export type CurrentUser =
  | { kind: "admin"; username: "admin" }
  | {
      kind: "member";
      accountId: string;
      canRead: boolean;
      canWrite: boolean;
    }
  | null;

export function useAuth() {
  const { data, isLoading } = useQuery(fetchAuthStatus());

  const user: CurrentUser | null = data?.user || null;
  const isLoggedIn = data?.isLoggedIn ?? false;
  const isAdmin = user?.kind === "admin";
  const canWrite = isAdmin || (user?.kind === "member" && user.canWrite);
  const canRead = isAdmin || (user?.kind === "member" && user.canRead);

  return {
    user,
    isLoggedIn,
    isAdmin,
    canWrite,
    canRead,
    isLoading,
  };
}
