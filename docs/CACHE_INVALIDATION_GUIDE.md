# Cache Invalidation Guide

## Overview

This guide explains how cache invalidation works in the application to ensure data consistency when the database is updated.

## Cache Layers

The application uses multiple cache layers that need to be cleared when data changes:

1. **Next.js Route Cache** - Server-side route caching
2. **NodeCache** - In-memory server-side cache (5-minute TTL)
3. **React Query** - Client-side data fetching and caching
4. **SessionStorage** - ETag and response data caching
5. **Next.js Tag Cache** - Tag-based cache invalidation

## Automatic Cache Invalidation

### When Caches Are Cleared

Caches are automatically cleared when:

1. **Transaction Mutations**
   - Creating a transaction (`POST /api/transaction/create`)
   - Deleting a transaction (`DELETE /api/transaction/[id]`)

2. **Account Mutations**
   - Creating an account (`POST /api/account`)
   - Updating an account (`POST /api/account` with id)
   - Updating member offsets (`POST /api/account/offset`)
   - Updating member access (`PATCH /api/admin/members/[id]/access`)
   - Updating member permissions (`PATCH /api/admin/members/[id]/permissions`)

3. **Dashboard Recalculations**
   - Recalculating all transactions (`POST /api/admin/recalculate`)
   - Recalculating dashboard (`POST /api/admin/dashboard/recalculate`)

## Cache Invalidation Utility

### Location
`src/lib/core/cache-invalidation.ts`

### Functions

#### `invalidateAllCaches(options?)`
Clears all cache layers with customizable options.

```typescript
await invalidateAllCaches({
  paths: ["*", "/api/dashboard"],
  tags: ["api", "dashboard"],
  clearNodeCache: true,
});
```

#### `invalidateTransactionCaches()`
Clears caches related to transactions.

**Clears:**
- Next.js route cache for `*`, `/api/transaction`, `/api/dashboard`
- Next.js tag cache for `api`, `transaction`, `dashboard`
- NodeCache (server-side in-memory cache)

#### `invalidateAccountCaches()`
Clears caches related to accounts, members, and vendors.

**Clears:**
- Next.js route cache for `*`, `/api/account`, `/api/dashboard`
- Next.js tag cache for `api`, `account`, `member`, `vendor`, `dashboard`
- NodeCache (server-side in-memory cache)

#### `invalidateLoanCaches()`
Clears caches related to loans.

**Clears:**
- Next.js route cache for `*`, `/api/account/loan`, `/api/dashboard`
- Next.js tag cache for `api`, `loan`, `dashboard`
- NodeCache (server-side in-memory cache)

#### `invalidateDashboardCaches()`
Clears caches related to dashboard calculations.

**Clears:**
- Next.js route cache for `*`, `/api/dashboard`
- Next.js tag cache for `api`, `dashboard`, `summary`
- NodeCache (server-side in-memory cache)

## Client-Side Cache Invalidation

### React Query Invalidation

Client-side React Query cache is invalidated in mutation `onSuccess` callbacks:

```typescript
const mutation = useMutation({
  mutationFn: (body: any) => fetcher.post("/api/transaction/create", { body }),
  onSuccess: async () => {
    // Invalidate React Query cache
    await queryClient.invalidateQueries({ queryKey: ["all"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  },
});
```

### SessionStorage Cache Clearing

The fetcher automatically clears sessionStorage cache entries after mutations:

- Clears ETag cache entries
- Clears response data cache entries
- Only clears related paths (dashboard, account, transaction)

## Implementation in API Routes

### Example: Transaction Creation

```typescript
import { invalidateTransactionCaches } from "@/lib/core/cache-invalidation";

export async function POST(request: Request) {
  // ... create transaction ...
  
  // Clear all caches after transaction creation
  await invalidateTransactionCaches();
  
  return NextResponse.json({ transaction: created }, { status: 201 });
}
```

### Example: Account Update

```typescript
import { invalidateAccountCaches } from "@/lib/core/cache-invalidation";

export async function POST(request: Request) {
  // ... update account ...
  
  // Clear all caches after account update
  await invalidateAccountCaches();
  
  return NextResponse.json({ account: updated }, { status: 200 });
}
```

## Cache Invalidation Flow

```
Database Mutation
    ↓
API Route Handler
    ↓
invalidateTransactionCaches() / invalidateAccountCaches() / etc.
    ↓
┌─────────────────────────────────────┐
│ 1. revalidatePath("*")              │ ← Next.js Route Cache
│ 2. revalidateTag("api")             │ ← Next.js Tag Cache
│ 3. clearCache()                     │ ← NodeCache
└─────────────────────────────────────┘
    ↓
Client Mutation onSuccess
    ↓
┌─────────────────────────────────────┐
│ queryClient.invalidateQueries()     │ ← React Query Cache
│ sessionStorage.clear() (related)  │ ← SessionStorage ETags
└─────────────────────────────────────┘
```

## Best Practices

1. **Always Clear Caches After Mutations**
   - Use the appropriate cache invalidation function
   - Don't skip cache clearing even if the operation seems minor

2. **Use Specific Invalidation Functions**
   - Use `invalidateTransactionCaches()` for transactions
   - Use `invalidateAccountCaches()` for accounts/members/vendors
   - Use `invalidateDashboardCaches()` for dashboard recalculations

3. **Client-Side Invalidation**
   - Always invalidate React Query cache in mutation `onSuccess`
   - Use specific query keys for targeted invalidation

4. **Error Handling**
   - Cache invalidation should not block the response
   - Log errors but don't fail the mutation if cache clearing fails

## Testing Cache Invalidation

To verify cache invalidation is working:

1. **Check Network Tab**
   - After a mutation, subsequent requests should not return 304 (Not Modified)
   - ETags should be different

2. **Check React Query DevTools**
   - Queries should be marked as stale after mutations
   - Cache should be cleared

3. **Check Server Logs**
   - NodeCache should show cache cleared messages
   - No stale data should be served

## Troubleshooting

### Issue: Stale Data After Mutations

**Solution:**
1. Verify cache invalidation is called in the API route
2. Check that React Query invalidation is in mutation `onSuccess`
3. Clear browser sessionStorage manually if needed

### Issue: Cache Not Clearing

**Solution:**
1. Check that `clearCache()` is being called
2. Verify `revalidatePath()` and `revalidateTag()` are called
3. Ensure client-side invalidation is in place

### Issue: Performance Impact

**Solution:**
1. Cache invalidation is fast and shouldn't impact performance
2. If needed, make cache clearing async and don't await it
3. Consider batching cache invalidations for bulk operations

## Summary

- ✅ All mutation endpoints clear caches automatically
- ✅ Server-side caches (Next.js, NodeCache) are cleared
- ✅ Client-side caches (React Query, SessionStorage) are cleared
- ✅ Cache invalidation is comprehensive and consistent
- ✅ Data consistency is maintained across all cache layers

---

**Last Updated**: 2024-12-19
**Version**: 1.0.0

