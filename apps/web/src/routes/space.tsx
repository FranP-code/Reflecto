import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Tldraw } from "tldraw";
import { z } from "zod";
import "tldraw/tldraw.css";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/space")({
  validateSearch: z.object({
    id: z.string().optional(),
  }).parse,
  component: SpaceRoute,
});

function SpaceRoute() {
  const { id } = Route.useSearch();
  const { data: session, isPending } = authClient.useSession();
  const navigate = Route.useNavigate();

  useEffect(() => {
    if (!((session || isPending) && id)) {
      navigate({
        to: "/login",
      });
    }
  }, [session, isPending, navigate, id]);

  // Use a stable persistence key so tabs with same id share state locally
  const persistenceKey = useMemo(() => `space-${id ?? "default"}`, [id]);

  return (
    <div className="mx-4 mt-4" style={{ position: "relative", inset: 0 }}>
      <Tldraw inferDarkMode persistenceKey={persistenceKey} />
    </div>
  );
}
