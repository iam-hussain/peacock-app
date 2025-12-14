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
          stdTTL: 300, // Cache time-to-live in seconds (5 minutes)
          checkperiod: 60, // Check for expired keys every minute
        });
      }
      Cache.instance = global.nodeCache;
    }
    return Cache.instance;
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
