import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Loader from "@/components/loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { trpc } from "@/utils/trpc";
import "../index.css";

export type RouterAppContext = {
  trpc: typeof trpc;
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Reflecto",
      },
      {
        name: "description",
        content: "Reflecto is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  });

  const currentPath = useRouterState({
    select: (s) => s.location.pathname,
  });

  const isSpaceRoute = currentPath === "/space";

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        enableColorScheme={true}
        enableSystem={false}
        forcedTheme="dark"
        storageKey="vite-ui-theme"
      >
        <div
          className={`grid min-h-svh ${isSpaceRoute ? "grid-rows-[1fr_auto]" : "grid-rows-[auto_1fr_auto]"}`}
        >
          {!isSpaceRoute && <Header />}
          {isFetching ? <Loader /> : <Outlet />}
          <Footer />
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
    </>
  );
}
