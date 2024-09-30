import { queryOptions } from "@tanstack/react-query";

import fetcher from "./fetcher";

import { GetStatisticsResponse } from "@/app/api/dashboard/statistics/route";
import { GetMemberResponse } from "@/app/api/member/route";
import { TransformedMemberSelect } from "@/app/api/member/select/route";
import { GetMemberTransactionResponse } from "@/app/api/member/transaction/route";
import { GetVendorResponse } from "@/app/api/vendor/route";
import { TransformedVendorSelect } from "@/app/api/vendor/select/route";
import { GetVendorTransactionResponse } from "@/app/api/vendor/transaction/route";

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

export const fetchMemberConnection = (memberId: string) =>
  queryOptions({
    queryKey: ["member-connection", "connection"],
    queryFn: () =>
      fetcher(`/api/member/connection/${memberId}`, {
        tags: ["member-connection"],
      }) as never as {
        connections: {
          vendor: {
            name: string;
            owner: {
              firstName: string;
              lastName: string | null;
            } | null;          
          };
          id: string;
          active: boolean;
        }[];
      },
    ...noRefetchConfigs,
  });

export const fetchMemberTransactions = (options: any) => {
  const params = new URLSearchParams({
    page: options.page.toString(),
    limit: options.limit.toString(),
    fromId: options.fromId.trim(),
    toId: options.toId.trim(),
    transactionType: options.transactionType.trim(),
    sortField: options.sortField,
    sortOrder: options.sortOrder,
    ...(options?.startDate ? { startDate: options.startDate as any } : {}),
    ...(options?.endDate ? { endDate: options.endDate as any } : {}),
  });

  return queryOptions({
    queryKey: ["member-transaction", options],
    queryFn: () =>
      fetcher(`/api/member/transaction?${params.toString()}`, {
        tags: ["member-transaction"],
      }) as unknown as GetMemberTransactionResponse,
    ...noRefetchConfigs,
  });
};

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
      fetcher("/api/member/select", {
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
      }) as never as {
        connections: {
          member: {
            firstName?: string;
            lastName?: string;
          };
          id: string;
          active: boolean;
        }[];
      },
    ...noRefetchConfigs,
  });

export const fetchVendorTransactions = (options: any) => {
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
    queryKey: ["vendor-transaction", options],
    queryFn: () =>
      fetcher(`/api/vendor/transaction?${params.toString()}`, {
        tags: ["vendor-transaction"],
      }) as unknown as GetVendorTransactionResponse,
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

export const fetchVendorsSelect = () =>
  queryOptions({
    queryKey: ["vendor-details", "vendors-select"],
    queryFn: () =>
      fetcher("/api/vendor/select", {
        tags: ["vendors-select"],
      }) as never as TransformedVendorSelect[],
    ...noRefetchConfigs,
  });
