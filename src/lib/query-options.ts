import { queryOptions } from "@tanstack/react-query";

import fetcher from "./fetcher";

import { GetLoanResponse } from "@/app/api/account/loan/route";
import { GetMemberBySlugResponse } from "@/app/api/account/member/[slug]/route";
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
      fetcher.post("/api/auth/status") as never as { isLoggedIn: boolean },
    ...noRefetchConfigs,
  });

export const fetchMemberBySlug = (slug: string) =>
  queryOptions({
    queryKey: ["member", "accounts", slug],
    queryFn: () =>
      fetcher.post(
        `/api/account/member/${slug}`
      ) as unknown as GetMemberBySlugResponse,
    ...noRefetchConfigs,
  });

export const fetchMembers = () =>
  queryOptions({
    queryKey: ["member", "account"],
    queryFn: () =>
      fetcher.post("/api/account/member") as unknown as GetMemberResponse,
    ...noRefetchConfigs,
  });

export const fetchVendors = () =>
  queryOptions({
    queryKey: ["vendor", "account"],
    queryFn: () =>
      fetcher.post("/api/account/vendor") as unknown as GetVendorResponse,
    ...noRefetchConfigs,
  });

export const fetchLoans = () =>
  queryOptions({
    queryKey: ["loan", "account"],
    queryFn: () =>
      fetcher.post("/api/account/loan") as unknown as GetLoanResponse,
    ...noRefetchConfigs,
  });

export const fetchAccountSelect = () =>
  queryOptions({
    queryKey: ["select", "account"],
    queryFn: () =>
      fetcher.post(
        "/api/account/select"
      ) as never as TransformedAccountSelect[],
    ...noRefetchConfigs,
  });

export const fetchStatistics = () =>
  queryOptions({
    queryKey: ["statistic"],
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
    queryKey: ["transaction", options],
    queryFn: () =>
      fetcher.post(
        `/api/transaction?${params.toString()}`
      ) as unknown as GetTransactionResponse,
    ...noRefetchConfigs,
  });
};
