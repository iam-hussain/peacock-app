import NodeCache from "node-cache";

// Create a cache instance with default TTL of 5 minutes
const cache = new NodeCache({
  stdTTL: 300, // Cache time-to-live in seconds (5 minutes)
  checkperiod: 60, // Check for expired keys every minute
});

export default cache;
