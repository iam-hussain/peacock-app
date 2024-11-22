import { queryOptions } from "@tanstack/react-query";

import fetcher from "./fetcher";

import { TransformedAccountSelect } from "@/app/api/account/select/route";
import { GetStatisticsResponse } from "@/app/api/dashboard/statistics/route";
import { GetLoanResponse } from "@/app/api/loan/route";
import { GetConnectionMemberVendor } from "@/app/api/member/connection/[memberId]/route";
import { GetMemberResponse } from "@/app/api/member/route";
import { GetTransactionResponse } from "@/app/api/transaction/route";
import { GetConnectionVendorMember } from "@/app/api/vendor/connection/[vendorId]/route";
import { GetVendorResponse } from "@/app/api/vendor/route";

const noRefetchConfigs = {
  // refetchOnMount: false,
  // refetchInactive: true,
  // refetchOnReconnect: true,
  // refetchOnWindowFocus: false,
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

export const fetchAccountSelect = () =>
  queryOptions({
    queryKey: ["account-select", "select", "accounts"],
    queryFn: () =>
      fetcher("/api/account/select") as never as TransformedAccountSelect[],
    ...noRefetchConfigs,
  });

export const fetchMemberConnection = (memberId: string) =>
  queryOptions({
    queryKey: ["member-connection", "connection", "accounts", memberId],
    queryFn: () =>
      fetcher(
        `/api/member/connection/${memberId}`
      ) as never as GetConnectionMemberVendor,
    ...noRefetchConfigs,
  });

export const fetchMembers = () =>
  queryOptions({
    queryKey: ["member-details", "members", "accounts"],
    queryFn: () => fetcher("/api/member") as unknown as GetMemberResponse,
    ...noRefetchConfigs,
  });

export const fetchStatistics = () =>
  queryOptions({
    queryKey: ["statistics", "connection"],
    queryFn: () =>
      fetcher("/api/dashboard/statistics") as never as GetStatisticsResponse,
    ...noRefetchConfigs,
  });

export const fetchVendorConnection = (vendorId: string) =>
  queryOptions({
    queryKey: ["vendor-connection", "connection", "accounts", vendorId],
    queryFn: () =>
      fetcher(
        `/api/vendor/connection/${vendorId}`
      ) as never as GetConnectionVendorMember,
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

export const fetchVendors = () =>
  queryOptions({
    queryKey: ["vendor-details", "vendors", "accounts"],
    queryFn: () => fetcher("/api/vendor") as unknown as GetVendorResponse,
    ...noRefetchConfigs,
  });

export const fetchLoans = () =>
  queryOptions({
    queryKey: ["loan-details", "loans", "accounts"],
    queryFn: () => fetcher("/api/loan") as unknown as GetLoanResponse,
    ...noRefetchConfigs,
  });
