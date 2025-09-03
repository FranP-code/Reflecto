import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user, isPending, isAuthenticated } = useAuth();

  const navigate = Route.useNavigate();

  const privateData = useQuery(trpc.privateData.queryOptions());

  useEffect(() => {
    if (!isAuthenticated && !isPending) {
      navigate({
        to: "/login",
      });
    }
  }, [isAuthenticated, isPending]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {user?.name}</p>
      <p>privateData: {privateData.data?.message}</p>
    </div>
  );
}
