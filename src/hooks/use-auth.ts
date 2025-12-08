"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAuthStatus } from "@/lib/query-options";

export type CurrentUser =
  | { kind: "admin"; username: "admin"; role: "SUPER_ADMIN"; id: "admin" }
  | {
      kind: "member";
      accountId: string;
      id: string;
      role: "MEMBER";
      readAccess: boolean;
      writeAccess: boolean;
    }
  | null;

export function useAuth() {
  const { data, isLoading } = useQuery(fetchAuthStatus());

  const user: CurrentUser | null = data?.user || null;
  const isLoggedIn = data?.isLoggedIn ?? false;
  const isAdmin = user?.kind === "admin";
  const canWrite = isAdmin || (user?.kind === "member" && user.writeAccess);
  const canRead = isAdmin || (user?.kind === "member" && user.readAccess);

  return {
    user,
    isLoggedIn,
    isAdmin,
    canWrite,
    canRead,
    isLoading,
  };
}
