export interface FetcherOptions {
  header?: any;
  body?: any;
}

const fetcher = async (
  path: string,
  options?: FetcherPropsOptions
): Promise<any> => {
  const {
    method = "GET",
    header = {},
    body = {},
    // tags = ["api"],
  } = options || {};

  try {
    const response = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json", ...header },
      ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
      next: { revalidate: 0 },
      cache: "no-store",
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).response = { data: responseData, status: response.status };
      throw error;
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
