export interface FetcherOptions {
  header?: Record<string, string>;
  body?: unknown;
}

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

export interface FetcherPropsOptions {
  method?: HttpMethod;
  header?: Record<string, string>;
  body?: unknown;
  tags?: string[];
}

interface FetcherError extends Error {
  response?: {
    data: unknown;
    status: number;
  };
}

const fetcher = async <T = unknown>(
  path: string,
  options?: FetcherPropsOptions
): Promise<T> => {
  const {
    method = "GET",
    header = {},
    body = {},
    // tags = ["api"],
  } = options || {};

  try {
    // For GET and POST requests, check if we have a cached ETag
    // POST requests can also benefit from ETags for read operations
    const cacheKey =
      method === "GET"
        ? `etag:${path}`
        : `etag:${path}:${JSON.stringify(body)}`;

    const cachedETag =
      typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...header,
    };

    // Add If-None-Match header for conditional requests (GET and POST)
    if ((method === "GET" || method === "POST") && cachedETag) {
      headers["If-None-Match"] = cachedETag;
    }

    const response = await fetch(path, {
      method,
      headers,
      ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
      next: { revalidate: 0 },
      cache: "no-store",
    });

    // Handle 304 Not Modified response
    if (response.status === 304) {
      // Return cached data from sessionStorage if available
      const dataKey =
        method === "GET"
          ? `data:${path}`
          : `data:${path}:${JSON.stringify(body)}`;
      const cachedData =
        typeof window !== "undefined" ? sessionStorage.getItem(dataKey) : null;
      if (cachedData) {
        try {
          return JSON.parse(cachedData);
        } catch {
          // If parsing fails, continue to fetch fresh data
        }
      }
      // If no cached data, return empty object (shouldn't happen)
      return {} as T;
    }

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        (responseData as { message?: string })?.message ||
        (responseData as { error?: string })?.error ||
        `Request failed with status ${response.status}`;
      const error = new Error(errorMessage) as FetcherError;
      error.response = { data: responseData, status: response.status };
      throw error;
    }

    // Cache ETag and response data for GET and POST requests
    if (
      (method === "GET" || method === "POST") &&
      typeof window !== "undefined"
    ) {
      const etag = response.headers.get("ETag");
      if (etag) {
        const dataKey =
          method === "GET"
            ? `data:${path}`
            : `data:${path}:${JSON.stringify(body)}`;
        sessionStorage.setItem(cacheKey, etag);
        sessionStorage.setItem(dataKey, JSON.stringify(responseData));
      }
    }

    // Clear sessionStorage cache for actual mutations (not read operations)
    // This ensures fresh data after mutations
    if (
      (method === "PATCH" || method === "DELETE") &&
      typeof window !== "undefined"
    ) {
      // Clear related cache entries after mutations
      const cacheKeys = Object.keys(sessionStorage);
      cacheKeys.forEach((key) => {
        // Clear ETags and data for related paths
        if (key.startsWith("etag:") || key.startsWith("data:")) {
          // Clear dashboard and related caches
          if (
            key.includes("/api/dashboard") ||
            key.includes("/api/account") ||
            key.includes("/api/transaction")
          ) {
            sessionStorage.removeItem(key);
          }
        }
      });
    }

    // For POST requests, only clear if it's a mutation endpoint (not a read operation)
    if (method === "POST" && typeof window !== "undefined") {
      const isMutationEndpoint =
        path.includes("/api/transaction/create") ||
        (path.includes("/api/account") &&
          !path.includes("/api/account/member") &&
          !path.includes("/api/account/vendor") &&
          !path.includes("/api/account/loan")) ||
        path.includes("/api/admin/");

      if (isMutationEndpoint) {
        // Clear related cache entries after mutations
        const cacheKeys = Object.keys(sessionStorage);
        cacheKeys.forEach((key) => {
          if (key.startsWith("etag:") || key.startsWith("data:")) {
            if (
              key.includes("/api/dashboard") ||
              key.includes("/api/account") ||
              key.includes("/api/transaction")
            ) {
              sessionStorage.removeItem(key);
            }
          }
        });
      }
    }

    return responseData as T;
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(errorMessage);
  }
};

// Function to fetch data using the GET method
fetcher.get = <T = unknown>(
  path: string,
  options: FetcherOptions = {}
): Promise<T> => {
  return fetcher<T>(path, { method: "GET", ...options });
};

// Function to fetch data using the POST method
fetcher.post = <T = unknown>(
  path: string,
  options: FetcherOptions = {}
): Promise<T> => {
  return fetcher<T>(path, { method: "POST", ...options });
};

// Function to fetch data using the PATCH method
fetcher.patch = <T = unknown>(
  path: string,
  options: FetcherOptions = {}
): Promise<T> => {
  return fetcher<T>(path, { method: "PATCH", ...options });
};

// Function to fetch data using the DELETE method
fetcher.delete = <T = unknown>(
  path: string,
  options: FetcherOptions = {}
): Promise<T> => {
  return fetcher<T>(path, { method: "DELETE", ...options });
};

export default fetcher;
