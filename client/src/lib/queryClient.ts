import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  options: {
    headers?: Record<string, string>;
    on401?: UnauthorizedBehavior;
  } = {}
): Promise<Response> {
  const { headers = {}, on401 = "throw" } = options;
  
  const requestHeaders: Record<string, string> = {
    ...headers
  };
  
  let body: string | undefined = undefined;
  
  if (data) {
    requestHeaders["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  }
  
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body,
    credentials: "include",
  });

  if (on401 === "returnNull" && res.status === 401) {
    return res;
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
