import { queryOptions } from "@tanstack/react-query";

import fetcher from "./fetcher";

import { GetLoanResponse } from "@/app/api/account/loan/route";
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
      fetcher("/api/auth/status") as never as {
        isLoggedIn: boolean;
      },
    ...noRefetchConfigs,
  });

export const fetchMembers = () =>
  queryOptions({
    queryKey: ["member-details", "members", "accounts"],
    queryFn: () =>
      fetcher("/api/account/member") as unknown as GetMemberResponse,
    ...noRefetchConfigs,
  });

export const fetchVendors = () =>
  queryOptions({
    queryKey: ["vendor-details", "vendors", "accounts"],
    queryFn: () =>
      fetcher("/api/account/vendor") as unknown as GetVendorResponse,
    ...noRefetchConfigs,
  });

export const fetchLoans = () =>
  queryOptions({
    queryKey: ["loan-details", "loans", "accounts"],
    queryFn: () => fetcher("/api/account/loan") as unknown as GetLoanResponse,
    ...noRefetchConfigs,
  });

export const fetchAccountSelect = () =>
  queryOptions({
    queryKey: ["account-select", "select", "accounts"],
    queryFn: () =>
      fetcher("/api/account/select") as never as TransformedAccountSelect[],
    ...noRefetchConfigs,
  });

export const fetchStatistics = () =>
  queryOptions({
    queryKey: ["statistics", "connection"],
    queryFn: () => fetcher("/api/statistics") as never as GetStatisticsResponse,
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
    queryKey: ["transaction", "fetch-transaction", "all-transaction", options],
    queryFn: () =>
      fetcher(
        `/api/transaction?${params.toString()}`
      ) as unknown as GetTransactionResponse,
    ...noRefetchConfigs,
  });
};
