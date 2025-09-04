import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createTLStore,
  getSnapshot,
  loadSnapshot,
  type TLStoreWithStatus,
  Tldraw,
} from "tldraw";
import { z } from "zod";
import "tldraw/tldraw.css";
import Loader from "@/components/loader";
import {
  getLatestSpaceSnapshot,
  type RemoteSnapshot,
  upsertSpaceSnapshot,
} from "@/lib/appwrite-db";
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

  // Create a stable store instance once
  const store = useMemo(() => createTLStore(), []);

  // TL Store with status for remote-loaded snapshots
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "not-synced",
    store,
  });

  // Track latest saved version hash to suppress redundant saves
  const lastSavedRef = useRef<string>("");

  // Load initial snapshot from Appwrite
  useEffect(() => {
    let cancelled = false;
    async function load(_id: string | undefined) {
      if (!(_id && session)) {
        return;
      }
      const remote = await getLatestSpaceSnapshot(_id, session.$id);
      if (remote) {
        try {
          loadSnapshot(store, remote);
        } catch {
          // ignore and start fresh
        }
      }
      if (!cancelled) {
        setStoreWithStatus({
          store,
          status: "synced-remote",
          connectionStatus: "online",
        });
      }
    }
    setStoreWithStatus({ status: "not-synced", store });
    load(id);
    return () => {
      cancelled = true;
    };
  }, [id, session, store]);

  if (!(id && session)) {
    return <Loader />;
  }

  return (
    <div className="mx-4 mt-4" style={{ position: "relative", inset: 0 }}>
      <Tldraw
        onMount={(editor) => {
          editor.user.updateUserPreferences({ colorScheme: "dark" });

          // Debounced save on document changes (user-originated)
          const debounceMs = 1200;
          let timeout: number | undefined;
          const unlisten = editor.store.listen(
            () => {
              if (!(id && session)) {
                return;
              }
              window.clearTimeout(timeout);
              timeout = window.setTimeout(async () => {
                try {
                  const payload: RemoteSnapshot = getSnapshot(editor.store);
                  const hash = JSON.stringify(payload.document);
                  if (hash === lastSavedRef.current) {
                    return;
                  }
                  await upsertSpaceSnapshot(
                    id,
                    { document: payload.document },
                    session.$id
                  );
                  lastSavedRef.current = hash;
                } catch {
                  // ignore save errors for now
                }
              }, debounceMs);
            },
            { scope: "document", source: "user" }
          );

          // Cleanup listener on unmount
          return () => {
            unlisten();
            window.clearTimeout(timeout);
          };
        }}
        store={storeWithStatus}
      />
    </div>
  );
}
