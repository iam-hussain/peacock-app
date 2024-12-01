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
        console.log("Cache instance created 🌍🌍🌍🌍🐳🐳🐳🐳");
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
      console.log(`🌟🌟🌟🌟1️⃣1️⃣: ${JSON.stringify(catchState)}`);
      global.nodeCache.flushAll();
      global.nodeCache.flushStats();
      console.log(`Cache cleared after API call 📟😎🌟🌟🌟🌟`);
      console.log(
        `🌟🌟🌟🌟💀💀: ${JSON.stringify(global.nodeCache.getStats())}`
      );
    }
  } else {
    console.log(`No Cache instance found 🔴🔴🌟🌟🌟🌟`);
  }
}

const cache: NodeCache = Cache.getInstance();
export default cache;
