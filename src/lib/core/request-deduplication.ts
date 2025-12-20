/**
 * Request Deduplication Utility
 * Prevents duplicate concurrent requests for the same resource
 */

type PendingRequest<T> = {
  promise: Promise<T>;
  timestamp: number;
};

const pendingRequests = new Map<string, PendingRequest<any>>();
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Deduplicates requests by caching pending promises
 * If a request for the same key is already in flight, returns the existing promise
 *
 * @param key - Unique identifier for the request
 * @param requestFn - Function that returns a promise
 * @returns Promise that resolves to the request result
 */
export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check if there's already a pending request
  const existing = pendingRequests.get(key);

  if (existing) {
    // Check if request is still valid (not timed out)
    const age = Date.now() - existing.timestamp;
    if (age < REQUEST_TIMEOUT) {
      return existing.promise;
    } else {
      // Request timed out, remove it
      pendingRequests.delete(key);
    }
  }

  // Create new request
  const promise = requestFn()
    .then((result) => {
      // Remove from pending requests on success
      pendingRequests.delete(key);
      return result;
    })
    .catch((error) => {
      // Remove from pending requests on error
      pendingRequests.delete(key);
      throw error;
    });

  // Store pending request
  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
  });

  return promise;
}

/**
 * Clears all pending requests (useful for testing or cleanup)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
}

/**
 * Gets the number of currently pending requests
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size;
}
