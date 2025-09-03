import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AnyRouter } from "@trpc/server";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
});

export const trpcClient = createTRPCClient<AnyRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_SERVER_URL}/trpc`,
      async fetch(url, options) {
        // Try to include a short-lived JWT to authorize on the server
        try {
          const jwt = await authClient.getJWT();
          return fetch(url, {
            ...options,
            credentials: "include",
            headers: {
              ...(options?.headers || {}),
              Authorization: `Bearer ${jwt}`,
            },
          });
        } catch {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        }
      },
    }),
  ],
});

export const trpc: any = createTRPCOptionsProxy<AnyRouter>({
  client: trpcClient,
  queryClient,
});

type TRPCUntypedClient = {
  query: (path: string, input?: unknown) => Promise<unknown>;
};

const untypedClient = trpcClient as unknown as TRPCUntypedClient;

export function queryHealthCheck(): Promise<string> {
  return untypedClient.query("healthCheck") as Promise<string>;
}

export function queryPrivateData(): Promise<{ message: string }> {
  return untypedClient.query("privateData") as Promise<{ message: string }>;
}
