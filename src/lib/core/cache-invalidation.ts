/**
 * Comprehensive Cache Invalidation Utility
 * Clears all cache layers when database is updated
 */

import { revalidatePath, revalidateTag } from "next/cache";

import { clearCache } from "./cache";

/**
 * Clears all cache layers after database mutations
 * Should be called after any create, update, or delete operation
 *
 * @param options - Options for cache invalidation
 */
export async function invalidateAllCaches(options?: {
  paths?: string[];
  tags?: string[];
  clearNodeCache?: boolean;
}) {
  const {
    paths = ["*"],
    tags = ["api"],
    clearNodeCache = true,
  } = options || {};

  // 1. Clear Next.js route cache
  paths.forEach((path) => {
    revalidatePath(path);
  });

  // 2. Clear Next.js tag cache
  tags.forEach((tag) => {
    revalidateTag(tag);
  });

  // 3. Clear NodeCache (server-side in-memory cache)
  if (clearNodeCache) {
    clearCache();
  }

  // Note: Client-side React Query cache invalidation should be done
  // in the mutation's onSuccess callback using queryClient.invalidateQueries()
}

/**
 * Cache invalidation for transaction mutations
 */
export async function invalidateTransactionCaches() {
  await invalidateAllCaches({
    paths: ["*", "/api/transaction", "/api/dashboard"],
    tags: ["api", "transaction", "dashboard"],
    clearNodeCache: true,
  });
}

/**
 * Cache invalidation for account/member/vendor mutations
 */
export async function invalidateAccountCaches() {
  await invalidateAllCaches({
    paths: ["*", "/api/account", "/api/dashboard"],
    tags: ["api", "account", "member", "vendor", "dashboard"],
    clearNodeCache: true,
  });
}

/**
 * Cache invalidation for loan mutations
 */
export async function invalidateLoanCaches() {
  await invalidateAllCaches({
    paths: ["*", "/api/account/loan", "/api/dashboard"],
    tags: ["api", "loan", "dashboard"],
    clearNodeCache: true,
  });
}

/**
 * Cache invalidation for dashboard/calculation changes
 */
export async function invalidateDashboardCaches() {
  await invalidateAllCaches({
    paths: ["*", "/api/dashboard"],
    tags: ["api", "dashboard", "summary"],
    clearNodeCache: true,
  });
}
