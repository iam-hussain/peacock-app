import { queryOptions } from "@tanstack/react-query";
import fetcher from "./fetcher";
import { GetMemberResponse, TransformedMember } from "@/app/api/members/route";
import {
  GetMemberTransactionResponse,
  TransformedMemberTransaction,
} from "@/app/api/member-transactions/route";
import { GetVendorResponse } from "@/app/api/vendors/route";
import { GetVendorTransactionResponse } from "@/app/api/vendor-transactions/route";

const noRefetchConfigs = {
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
};

export const fetchMembers = () =>
  queryOptions({
    queryKey: ["members"],
    queryFn: () => fetcher("/api/members") as unknown as GetMemberResponse,
    ...noRefetchConfigs,
  });

export const fetchVendors = () =>
  queryOptions({
    queryKey: ["vendors"],
    queryFn: () => fetcher("/api/vendors") as unknown as GetVendorResponse,
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
    queryKey: ["member-transactions", options],
    queryFn: () =>
      fetcher(
        `/api/member-transactions?${params.toString()}`,
      ) as unknown as GetMemberTransactionResponse,
    ...noRefetchConfigs,
  });
};

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
    queryKey: ["vendor-transactions", options],
    queryFn: () =>
      fetcher(
        `/api/vendor-transactions?${params.toString()}`,
      ) as unknown as GetVendorTransactionResponse,
    ...noRefetchConfigs,
  });
};

export const fetchMembersSelect = () =>
  queryOptions({
    queryKey: ["members-select"],
    queryFn: () => fetcher("/api/members/select"),
    ...noRefetchConfigs,
  });

export const fetchVendorsSelect = () =>
  queryOptions({
    queryKey: ["vendors-select"],
    queryFn: () => fetcher("/api/vendors/select"),
    ...noRefetchConfigs,
  });

export const fetchStatistics = () =>
  queryOptions({
    queryKey: ["statistics"],
    queryFn: () => fetcher("/api/statistics"),
    ...noRefetchConfigs,
  });
