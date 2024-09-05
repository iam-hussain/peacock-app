// import { mutationOp } from "@tanstack/react-query";
// import fetcher from "./fetcher";
// import { GetMemberResponse } from "@/app/api/member/route";
// import { GetMemberTransactionResponse } from "@/app/api/member/transaction/route";
// import { GetVendorResponse } from "@/app/api/vendor/route";
// import { GetVendorTransactionResponse } from "@/app/api/vendor/transaction/route";
// import { GetStatisticsResponse } from "@/app/api/dashboard/statistics/route";
// import { TransformedVendorSelect } from "@/app/api/vendor/select/route";
// import { TransformedMemberSelect } from "@/app/api/member/select/route";

// const noRefetchConfigs = {
// };

// export const fetchMembers = () =>
//   queryOptions({
//     queryKey: ["members"],
//     queryFn: () =>
//       fetcher("/api/member", {
//         tags: ["members"],
//       }) as unknown as GetMemberResponse,
//     ...noRefetchConfigs,
//   });

// export const fetchVendors = () =>
//   queryOptions({
//     queryKey: ["vendors"],
//     queryFn: () =>
//       fetcher("/api/vendor", {
//         tags: ["vendors"],
//       }) as unknown as GetVendorResponse,
//     ...noRefetchConfigs,
//   });

// export const fetchMemberTransactions = (options: any) => {
//   const params = new URLSearchParams({
//     page: options.page.toString(),
//     limit: options.limit.toString(),
//     fromId: options.fromId.trim(),
//     toId: options.toId.trim(),
//     transactionType: options.transactionType.trim(),
//     sortField: options.sortField,
//     sortOrder: options.sortOrder,
//     ...(options?.startDate ? { startDate: options.startDate as any } : {}),
//     ...(options?.endDate ? { endDate: options.endDate as any } : {}),
//   });

//   return queryOptions({
//     queryKey: ["member-transaction", options],
//     queryFn: () =>
//       fetcher(`/api/member/transaction?${params.toString()}`, {
//         tags: ["member-transaction"],
//       }) as unknown as GetMemberTransactionResponse,
//     ...noRefetchConfigs,
//   });
// };

// export const fetchVendorTransactions = (options: any) => {
//   const params = new URLSearchParams({
//     page: options.page.toString(),
//     limit: options.limit.toString(),
//     vendorId: options.vendorId.trim(),
//     memberId: options.memberId.trim(),
//     transactionType: options.transactionType.trim(),
//     sortField: options.sortField,
//     sortOrder: options.sortOrder,
//     ...(options?.startDate ? { startDate: options.startDate as any } : {}),
//     ...(options?.endDate ? { endDate: options.endDate as any } : {}),
//   });

//   return queryOptions({
//     queryKey: ["vendor-transaction", options],
//     queryFn: () =>
//       fetcher(`/api/vendor/transaction?${params.toString()}`, {
//         tags: ["vendor-transaction"],
//       }) as unknown as GetVendorTransactionResponse,
//     ...noRefetchConfigs,
//   });
// };

// export const fetchMembersSelect = () =>
//   queryOptions({
//     queryKey: ["members-select"],
//     queryFn: () =>
//       fetcher("/api/member/select", {
//         tags: ["members-select"],
//       }) as never as TransformedMemberSelect[],
//     ...noRefetchConfigs,
//   });

// export const fetchVendorsSelect = () =>
//   queryOptions({
//     queryKey: ["vendors-select"],
//     queryFn: () =>
//       fetcher("/api/vendor/select", {
//         tags: ["vendors-select"],
//       }) as never as TransformedVendorSelect[],
//     ...noRefetchConfigs,
//   });

// export const fetchStatistics = () =>
//   queryOptions({
//     queryKey: ["statistics"],
//     queryFn: () =>
//       fetcher("/api/dashboard/statistics", {
//         tags: ["statistics"],
//       }) as never as GetStatisticsResponse,
//     ...noRefetchConfigs,
//   });

// export const fetchMemberConnection = (memberId: string) =>
//   queryOptions({
//     queryKey: ["member-connection"],
//     queryFn: () =>
//       fetcher(`/api/member/connection/${memberId}`, {
//         tags: ["member-connection"],
//       }) as never as {
//         connections: {
//           vendor: {
//             name: string;
//           };
//           id: string;
//           active: boolean;
//         }[];
//       },
//     ...noRefetchConfigs,
//   });

// export const fetchVendorConnection = (vendorId: string) =>
//   queryOptions({
//     queryKey: ["vendor-connection"],
//     queryFn: () =>
//       fetcher(`/api/vendor/connection/${vendorId}`, {
//         tags: ["vendor-connection"],
//       }) as never as {
//         connections: {
//           member: {
//             firstName?: string;
//             lastName?: string;
//           };
//           id: string;
//           active: boolean;
//         }[];
//       },
//     ...noRefetchConfigs,
//   });

// export const fetchAuthStatus = () =>
//   queryOptions({
//     queryKey: ["auth"],
//     queryFn: () =>
//       fetcher("/api/auth/status", { tags: ["auth"] }) as never as {
//         isLoggedIn: boolean;
//       },
//     ...noRefetchConfigs,
//   });
