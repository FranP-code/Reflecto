import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useUser } from "@/lib/auth-client";
import { queryPrivateData } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: user, isPending } = useUser();

  const navigate = Route.useNavigate();

  const privateData = useQuery({
    queryKey: ["privateData"],
    queryFn: queryPrivateData,
  });

  useEffect(() => {
    if (!(user || isPending)) {
      navigate({
        to: "/login",
      });
    }
  }, [user, isPending, navigate]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {user?.name}</p>
      <p>
        privateData:{" "}
        {typeof privateData.data === "object"
          ? (privateData.data as { message?: string })?.message
          : null}
      </p>
    </div>
  );
}
