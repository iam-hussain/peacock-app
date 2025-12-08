"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAuthStatus } from "@/lib/query-options";

export type CurrentUser =
  | { kind: "admin"; username: "admin"; role: "SUPER_ADMIN"; id: "admin" }
  | {
      kind: "admin-member";
      accountId: string;
      id: string;
      role: "ADMIN";
      readAccess: boolean;
      writeAccess: boolean;
    }
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
  // Admin includes both SUPER_ADMIN and ADMIN roles
  const isAdmin = user?.kind === "admin" || user?.kind === "admin-member";
  // canWrite: admin can write, or member with writeAccess (but can't create/edit accounts)
  const canWrite = isAdmin || (user?.kind === "member" && user.writeAccess);
  const canRead = isAdmin || (user?.kind === "member" && user.readAccess);
  // canManageAccounts: only admins (SUPER_ADMIN or ADMIN) can create/edit accounts
  const canManageAccounts = isAdmin;

  return {
    user,
    isLoggedIn,
    isAdmin,
    canWrite,
    canRead,
    canManageAccounts,
    isLoading,
  };
}
