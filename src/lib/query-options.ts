import { queryOptions } from "@tanstack/react-query";

import fetcher from "./fetcher";

import { GetLoanResponse } from "@/app/api/account/loan/route";
import { GetMemberByUsernameResponse } from "@/app/api/account/member/[username]/route";
import { GetMemberResponse } from "@/app/api/account/member/route";
import { TransformedAccountSelect } from "@/app/api/account/select/route";
import { GetVendorResponse } from "@/app/api/account/vendor/route";
import { GetStatisticsResponse } from "@/app/api/statistics/route";
import { GetTransactionResponse } from "@/app/api/transaction/route";

const noRefetchConfigs = {
  refetchOnMount: false,
  refetchInactive: true,
  refetchOnReconnect: true,
  refetchOnWindowFocus: false,
};

export const fetchAuthStatus = () =>
  queryOptions({
    queryKey: ["authentication"],
    queryFn: () =>
      fetcher.post("/api/auth/status") as never as {
        isLoggedIn: boolean;
        user:
          | {
              kind: "admin";
              username: "admin";
              role: "SUPER_ADMIN";
              id: "admin";
            }
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
      },
    ...noRefetchConfigs,
  });

export const fetchMemberByUsername = (username: string) =>
  queryOptions({
    queryKey: ["all", "member", "accounts", username],
    queryFn: () =>
      fetcher.post(
        `/api/account/member/${username}`
      ) as unknown as GetMemberByUsernameResponse,
    ...noRefetchConfigs,
  });

export const fetchMembers = () =>
  queryOptions({
    queryKey: ["all", "member", "account"],
    queryFn: () =>
      fetcher.post("/api/account/member") as unknown as GetMemberResponse,
    ...noRefetchConfigs,
  });

export const fetchVendors = () =>
  queryOptions({
    queryKey: ["all", "vendor", "account"],
    queryFn: () =>
      fetcher.post("/api/account/vendor") as unknown as GetVendorResponse,
    ...noRefetchConfigs,
  });

export const fetchLoans = () =>
  queryOptions({
    queryKey: ["all", "loan", "account"],
    queryFn: () =>
      fetcher.post("/api/account/loan") as unknown as GetLoanResponse,
    ...noRefetchConfigs,
  });

export const fetchAccountSelect = () =>
  queryOptions({
    queryKey: ["select", "account", "member", "vendor"],
    queryFn: () =>
      fetcher.post(
        "/api/account/select"
      ) as never as TransformedAccountSelect[],
    ...noRefetchConfigs,
  });

export const fetchStatistics = () =>
  queryOptions({
    queryKey: ["all", "statistic"],
    queryFn: () =>
      fetcher.post("/api/statistics") as never as GetStatisticsResponse,
    ...noRefetchConfigs,
  });

export const fetchTransactions = (options: any) => {
  const params = new URLSearchParams({
    page: options.page.toString(),
    limit: options.limit.toString(),
    accountId: options.accountId.trim(),
    transactionType: options.transactionType.trim(),
    sortField: options.sortField,
    sortOrder: options.sortOrder,
    ...(options?.startDate ? { startDate: options.startDate as any } : {}),
    ...(options?.endDate ? { endDate: options.endDate as any } : {}),
  });

  return queryOptions({
    queryKey: ["all", "transaction", options],
    queryFn: () =>
      fetcher.post(
        `/api/transaction?${params.toString()}`
      ) as unknown as GetTransactionResponse,
    ...noRefetchConfigs,
  });
};

export const fetchDashboardSummary = (month?: string) =>
  queryOptions({
    queryKey: ["dashboard", "summary", month || "latest"],
    queryFn: () =>
      fetcher.get(
        month
          ? `/api/dashboard/summary?month=${month}`
          : "/api/dashboard/summary/latest"
      ) as Promise<{
        success: boolean;
        summary: any;
        error?: string;
      }>,
    retry: false, // Don't retry on 503/404 errors
    ...noRefetchConfigs,
  });

export const fetchDashboardGraphs = (from: string, to: string) =>
  queryOptions({
    queryKey: ["dashboard", "graphs", from, to],
    queryFn: () =>
      fetcher.get(`/api/dashboard/graphs?from=${from}&to=${to}`) as Promise<{
        success: boolean;
        summaries: any[];
      }>,
    ...noRefetchConfigs,
  });
