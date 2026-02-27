import { queryOptions } from "@tanstack/react-query";

import { GetLoanResponse } from "@/app/api/account/loan/route";
import { GetMemberByUsernameResponse } from "@/app/api/account/member/[username]/route";
import { GetMemberResponse } from "@/app/api/account/member/route";
import { TransformedAccountSelect } from "@/app/api/account/select/route";
import { GetVendorResponse } from "@/app/api/account/vendor/route";
import {
  GetTransactionResponse,
  TransformedTransaction,
} from "@/app/api/transaction/route";
import fetcher from "@/lib/core/fetcher";

type GetStatisticsResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// Base config for queries that should cache but not auto-refetch
const noRefetchConfigs = {
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  // Cache for 2 minutes (data is considered fresh for 30s, then stale but cached for 2min)
  staleTime: 30 * 1000,
  gcTime: 2 * 60 * 1000,
};

// Config for frequently changing data (dashboard, transactions)
const frequentDataConfig = {
  ...noRefetchConfigs,
  staleTime: 15 * 1000, // Fresh for 15 seconds
  gcTime: 1 * 60 * 1000, // Cache for 1 minute
};

// Config for relatively static data (members, vendors, accounts)
const staticDataConfig = {
  ...noRefetchConfigs,
  staleTime: 2 * 60 * 1000, // Fresh for 2 minutes
  gcTime: 10 * 60 * 1000, // Cache for 10 minutes
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
              accessLevel: "ADMIN";
            }
          | {
              kind: "admin-member";
              accountId: string;
              id: string;
              role: "ADMIN";
              accessLevel: "ADMIN";
            }
          | {
              kind: "member";
              accountId: string;
              id: string;
              role: "MEMBER";
              accessLevel: "READ" | "WRITE" | "ADMIN";
            }
          | null;
      },
    ...staticDataConfig, // Auth status doesn't change frequently
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
    ...staticDataConfig, // Members list changes infrequently
  });

export const fetchVendors = () =>
  queryOptions({
    queryKey: ["all", "vendor", "account"],
    queryFn: () =>
      fetcher.post("/api/account/vendor") as unknown as GetVendorResponse,
    ...staticDataConfig, // Vendors list changes infrequently
  });

export const fetchLoans = () =>
  queryOptions({
    queryKey: ["all", "loan", "account"],
    queryFn: () =>
      fetcher.post("/api/account/loan") as unknown as GetLoanResponse,
    ...frequentDataConfig, // Loans can change more frequently
  });

export const fetchAccountSelect = () =>
  queryOptions({
    queryKey: ["select", "account", "member", "vendor"],
    queryFn: () =>
      fetcher.post(
        "/api/account/select"
      ) as never as TransformedAccountSelect[],
    ...staticDataConfig, // Account select list changes infrequently
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
    ...frequentDataConfig, // Transactions change frequently
  });
};

export const fetchTransactionById = (id: string) =>
  queryOptions({
    queryKey: ["transaction", id],
    queryFn: () =>
      fetcher.get(`/api/transaction/${id}`) as unknown as {
        transaction: TransformedTransaction | null;
      },
    ...noRefetchConfigs,
  });

export const fetchDashboardSummary = (month?: string) =>
  queryOptions({
    queryKey: ["dashboard", "summary", month || "latest"],
    queryFn: async () => {
      try {
        const response = await fetcher.get(
          month
            ? `/api/dashboard/summary?month=${month}`
            : "/api/dashboard/summary"
        );
        return response as {
          success: boolean;
          data?: {
            members: {
              activeMembers: number;
              clubAgeMonths: number;
            };
            memberFunds: {
              totalDeposits: number;
              memberBalance: number;
            };
            memberOutflow: {
              profitWithdrawals: number;
              memberAdjustments: number;
              pendingAdjustments?: number;
            };
            loans: {
              lifetime: {
                totalLoanGiven: number;
                totalInterestCollected: number;
              };
              outstanding: {
                currentLoanTaken: number;
                interestBalance: number;
              };
            };
            vendor: {
              vendorInvestment: number;
              vendorProfit: number;
            };
            cashFlow: {
              totalProfit: number;
              totalInvested: number;
              pendingAmounts: number;
            };
            valuation: {
              availableCash: number;
              currentValue: number;
            };
            portfolio: {
              totalPortfolioValue: number;
            };
            systemMeta: {
              monthStartDate: Date;
              monthEndDate: Date;
              recalculatedAt: Date;
              recalculatedByAdminId: string | null;
              isLocked: boolean;
            };
          };
          error?: string;
        };
      } catch (error: any) {
        // Log the error for debugging
        console.error("Error fetching dashboard summary:", error);
        // Return error response structure for proper error handling
        const errorMessage =
          error?.message ||
          error?.response?.data?.error ||
          error?.response?.status === 404
            ? "No dashboard data found. Please run recalculation first."
            : "Failed to fetch dashboard summary";
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    retry: false, // Don't retry on 503/404 errors
    ...frequentDataConfig, // Dashboard data changes frequently
  });

export const fetchDashboardClubPassbook = () =>
  queryOptions({
    queryKey: ["dashboard", "club-passbook"],
    queryFn: async () => {
      try {
        const response = await fetcher.get("/api/dashboard/club-passbook");
        return response as {
          success: boolean;
          data?: {
            members: {
              activeMembers: number;
              clubAgeMonths: number;
            };
            memberFunds: {
              totalDeposits: number;
              memberBalance: number;
            };
            memberOutflow: {
              profitWithdrawals: number;
              memberAdjustments: number;
              pendingAdjustments?: number;
            };
            loans: {
              lifetime: {
                totalLoanGiven: number;
                totalInterestCollected: number;
              };
              outstanding: {
                currentLoanTaken: number;
                interestBalance: number;
              };
            };
            vendor: {
              vendorInvestment: number;
              vendorProfit: number;
            };
            cashFlow: {
              totalProfit: number;
              totalInvested: number;
              pendingAmounts: number;
            };
            valuation: {
              availableCash: number;
              currentValue: number;
            };
            portfolio: {
              totalPortfolioValue: number;
            };
            systemMeta: {
              monthStartDate: Date | null;
              monthEndDate: Date | null;
              recalculatedAt: Date;
              recalculatedByAdminId: string | null;
              isLocked: boolean;
            };
          };
          error?: string;
        };
      } catch (error: any) {
        console.error("Error fetching club passbook:", error);
        const errorMessage =
          error?.message ||
          error?.response?.data?.error ||
          error?.response?.status === 404
            ? "CLUB passbook not found. Please run seed to initialize database."
            : "Failed to fetch club passbook";
        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    retry: false,
    ...frequentDataConfig, // Club passbook data changes frequently
  });

export const fetchDashboardGraphs = (from: string, to: string) =>
  queryOptions({
    queryKey: ["dashboard", "graphs", from, to],
    queryFn: () =>
      fetcher.get(
        `/api/dashboard/summary/range?from=${from}&to=${to}`
      ) as Promise<{
        success: boolean;
        from: string;
        to: string;
        count: number;
        summaries: any[];
      }>,
    ...staticDataConfig, // Historical graph data doesn't change
  });
