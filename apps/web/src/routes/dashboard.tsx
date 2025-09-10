import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { SpacesGrid } from "@/components/spaces-grid";
import { authClient, account } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const me = await account.get();
    if (!me) {
      throw redirect({ to: "/" });
    }
    const isVerified = Boolean(me.emailVerification);
    if (!isVerified) {
      throw redirect({ to: "/verify-email" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <SpacesGrid />
    </div>
  );
}
