import { queryOptions } from "@tanstack/react-query";

import fetcher from "./fetcher";

import { TransformedAccountSelect } from "@/app/api/account/select/route";
import { GetStatisticsResponse } from "@/app/api/dashboard/statistics/route";
import { GetLoanResponse } from "@/app/api/loan/route";
import { GetConnectionMemberVendor } from "@/app/api/member/connection/[memberId]/route";
import { GetMemberResponse } from "@/app/api/member/route";
import { TransformedMemberSelect } from "@/app/api/member/select/route";
import { GetTransactionResponse } from "@/app/api/transaction/route";
import { GetConnectionVendorMember } from "@/app/api/vendor/connection/[vendorId]/route";
import { GetVendorResponse } from "@/app/api/vendor/route";
import { TransformedVendorSelect } from "@/app/api/vendor/select/route";

const noRefetchConfigs = {
  // refetchOnMount: false,
  // refetchInactive: true,
  // refetchOnReconnect: true,
  // refetchOnWindowFocus: false,
};

export const fetchAuthStatus = () =>
  queryOptions({
    queryKey: ["auth", "status"],
    queryFn: () =>
      fetcher("/api/auth/status", { tags: ["auth"] }) as never as {
        isLoggedIn: boolean;
      },
    ...noRefetchConfigs,
  });

export const fetchAccountSelect = () =>
  queryOptions({
    queryKey: ["account-details", "account-select"],
    queryFn: () =>
      fetcher("/api/account/select") as never as TransformedAccountSelect[],
    ...noRefetchConfigs,
  });

export const fetchMemberConnection = (memberId: string) =>
  queryOptions({
    queryKey: ["member-connection", "connection"],
    queryFn: () =>
      fetcher(`/api/member/connection/${memberId}`, {
        tags: ["member-connection"],
      }) as never as GetConnectionMemberVendor,
    ...noRefetchConfigs,
  });

export const fetchMembers = () =>
  queryOptions({
    queryKey: ["member-details", "members", "connection"],
    queryFn: () =>
      fetcher("/api/member", {
        tags: ["members"],
      }) as unknown as GetMemberResponse,
    ...noRefetchConfigs,
  });

export const fetchMembersSelect = () =>
  queryOptions({
    queryKey: ["member-details", "members-select"],
    queryFn: () =>
      fetcher("/api/account/select", {
        tags: ["members-select"],
      }) as never as TransformedMemberSelect[],
    ...noRefetchConfigs,
  });

export const fetchStatistics = () =>
  queryOptions({
    queryKey: ["statistics", "connection"],
    queryFn: () =>
      fetcher("/api/dashboard/statistics", {
        tags: ["statistics", "connection"],
      }) as never as GetStatisticsResponse,
    ...noRefetchConfigs,
  });

export const fetchVendorConnection = (vendorId: string) =>
  queryOptions({
    queryKey: ["vendor-connection", "connection"],
    queryFn: () =>
      fetcher(`/api/vendor/connection/${vendorId}`, {
        tags: ["vendor-connection"],
      }) as never as GetConnectionVendorMember,
    ...noRefetchConfigs,
  });

export const fetchTransactions = (options: any) => {
  const params = new URLSearchParams({
    page: options.page.toString(),
    limit: options.limit.toString(),
    vendorId: options.vendorId.trim(),
    memberId: options.memberId.trim(),
    transactionType: options.transactionType.trim(),
    sortField: options.sortField,
    sortOrder: options.sortOrder,
    ...(options?.startDate ? { startDate: options.startDate as any } : {}),
    ...(options?.endDate ? { endDate: options.endDate as any } : {}),
  });

  return queryOptions({
    queryKey: ["transaction", options],
    queryFn: () =>
      fetcher(`/api/transaction?${params.toString()}`, {
        tags: ["fetch-transaction", "all-transaction"],
      }) as unknown as GetTransactionResponse,
    ...noRefetchConfigs,
  });
};

export const fetchVendors = () =>
  queryOptions({
    queryKey: ["vendor-details", "vendors", "connection"],
    queryFn: () =>
      fetcher("/api/vendor", {
        tags: ["vendors"],
      }) as unknown as GetVendorResponse,
    ...noRefetchConfigs,
  });

export const fetchAllVendorsSelect = () =>
  queryOptions({
    queryKey: ["vendor-details", "vendors-select"],
    queryFn: () =>
      fetcher("/api/account/select", {
        tags: ["vendors-select"],
      }) as never as TransformedVendorSelect[],
    ...noRefetchConfigs,
  });

export const fetchLoanSelect = () =>
  queryOptions({
    queryKey: ["vendor-details", "vendors-select", "loan-vendors-select"],
    queryFn: () =>
      fetcher("/api/account/select?type=LEND", {
        tags: ["vendors-select"],
      }) as never as TransformedVendorSelect[],
    ...noRefetchConfigs,
  });

export const fetchVendorSelect = () =>
  queryOptions({
    queryKey: ["vendor-details", "vendors-select", "chit-vendors-select"],
    queryFn: () =>
      fetcher("/api/account/select?type=DEFAULT-CHIT-BANK", {
        tags: ["vendors-select"],
      }) as never as TransformedVendorSelect[],
    ...noRefetchConfigs,
  });

export const fetchLoans = () =>
  queryOptions({
    queryKey: ["loan-details", "loans"],
    queryFn: () =>
      fetcher("/api/loan", {
        tags: ["vendors"],
      }) as unknown as GetLoanResponse,
    ...noRefetchConfigs,
  });
