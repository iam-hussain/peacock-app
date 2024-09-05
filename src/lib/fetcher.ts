export interface FetcherOptions {
  header?: any;
  body?: any;
}

const fetcher = async (
  path: string,
  options?: FetcherPropsOptions
): Promise<any> => {
  const { method = "GET", header = {}, body = {}, tags = [] } = options || {};

  try {
    const response = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...header,
      },
      ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
      next: { tags },
      // cache: "no-store",
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData?.message || "Failed to fetch transactions");
    }

    return responseData;
  } catch (err: any) {
    console.error(err);
    throw new Error(err?.message || err);
  }
};

export interface FetcherPropsOptions {
  method?: string;
  header?: any;
  body?: any;
  tags?: string[];
}
// Function to fetch data using the GET method
fetcher.get = (path: string, options: FetcherOptions = {}) => {
  return fetcher(path, { method: "GET", ...options });
};

// Function to fetch data using the POST method
fetcher.post = (path: string, options: FetcherOptions = {}) => {
  return fetcher(path, { method: "POST", ...options });
};

// Function to fetch data using the PATCH method
fetcher.patch = (path: string, options: FetcherOptions = {}) => {
  return fetcher(path, { method: "PATCH", ...options });
};

// Function to fetch data using the DELETE method
fetcher.delete = (path: string, options: FetcherOptions = {}) => {
  return fetcher(path, { method: "DELETE", ...options });
};

export default fetcher;
