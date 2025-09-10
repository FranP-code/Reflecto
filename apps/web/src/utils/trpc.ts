import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import type { AppRouter } from "../../../server/src/routers";

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

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_SERVER_URL}/trpc`,
      async fetch(url, options) {
        const jwt = await authClient.getJWT();
        const headers = new Headers(options?.headers);
        if (jwt) {
          headers.set("Authorization", `Bearer ${jwt}`);
        }
        // Inject selected AI model into every request for server-side routing
        // Preference is saved by the Settings page to localStorage (and Appwrite)
        try {
          const model = localStorage.getItem("aiModel") ?? "";
          if (model) {
            headers.set("x-ai-model", model);
          }
        } catch {
          // ignore storage access issues (e.g., SSR or privacy modes)
        }
        return fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
