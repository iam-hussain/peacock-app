import NodeCache from "node-cache";

declare global {
  // Ensure this type is available globally
  // eslint-disable-next-line no-var, unused-imports/no-unused-vars
  var nodeCache: NodeCache | undefined;
}

class Cache {
  private static instance: NodeCache;

  private constructor() {}

  public static getInstance(): NodeCache {
    if (!Cache.instance) {
      if (typeof global.nodeCache === "undefined") {
        global.nodeCache = new NodeCache({
          stdTTL: 300, // Default cache time-to-live in seconds (5 minutes)
          checkperiod: 60, // Check for expired keys every minute
          useClones: false, // Better performance - don't clone cached values
          maxKeys: 1000, // Limit cache size to prevent memory issues
        });
      }
      Cache.instance = global.nodeCache;
    }
    return Cache.instance;
  }

  // Helper method to get cache with custom TTL
  public static get(key: string): any {
    return Cache.getInstance().get(key);
  }

  // Helper method to set cache with custom TTL
  public static set(key: string, value: any, ttl?: number): boolean {
    if (ttl !== undefined) {
      return Cache.getInstance().set(key, value, ttl);
    }
    return Cache.getInstance().set(key, value);
  }
}

export function clearCache() {
  if (global.nodeCache) {
    const catchState = global.nodeCache.getStats();
    if (catchState.keys > 0) {
      global.nodeCache.flushAll();
      global.nodeCache.flushStats();
    }
  }
}

const cache: NodeCache = Cache.getInstance();
export default cache;
