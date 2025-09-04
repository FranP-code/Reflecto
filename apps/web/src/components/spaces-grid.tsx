import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { Tldraw } from "tldraw";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listUserSpaceSnapshots } from "@/lib/appwrite-db";
import { authClient } from "@/lib/auth-client";

type SpaceCard = {
  id: string;
  name: string;
  lastEdited: string;
  snapshotText: string;
  itemCount: number;
  color: string;
};

export function SpacesGrid() {
  const { data: session } = authClient.useSession();

  const spacesQuery = useQuery({
    queryKey: ["spaces", session?.$id],
    queryFn: async () => {
      if (!session?.$id) {
        return [] as SpaceCard[];
      }
      const rows = await listUserSpaceSnapshots(session.$id);
      return rows.map(({ row, snapshot }, idx) => {
        const snapshotText = snapshot
          ? JSON.stringify(snapshot)
          : (row.snapshot ?? "");
        const itemCount = (() => {
          try {
            const doc = snapshot?.document as unknown as
              | {
                  store?: { records?: Record<string, unknown> };
                  records?: Record<string, unknown>;
                }
              | undefined;
            const recs = doc?.store?.records ?? doc?.records;
            return recs ? Object.keys(recs).length : 0;
          } catch {
            return 0;
          }
        })();
        const COLORS = [
          "bg-blue-500",
          "bg-green-500",
          "bg-purple-500",
          "bg-orange-500",
          "bg-pink-500",
          "bg-cyan-500",
        ] as const;
        return {
          id: row.spaceId,
          name: row.spaceId,
          lastEdited: row.$updatedAt
            ? new Date(row.$updatedAt).toLocaleString()
            : "",
          snapshotText,
          itemCount,
          // keep some color variety
          color: COLORS[idx % COLORS.length],
        } satisfies SpaceCard;
      });
    },
    staleTime: 10_000,
  });

  const spaces = spacesQuery.data ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-foreground">Your Spaces</h1>
          <p className="mt-1 text-muted-foreground">
            Organize your thoughts and ideas in visual workspaces
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Space
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
          <Input className="pl-10" placeholder="Search spaces..." />
        </div>
        <Badge className="px-3 py-1" variant="secondary">
          {spacesQuery.isLoading ? "Loading…" : `${spaces.length} spaces`}
        </Badge>
      </div>

      {/* Spaces Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <Card
            className="group cursor-pointer border-border/50 transition-all duration-200 hover:border-border hover:shadow-lg"
            key={space.id}
            onClick={() => {
              window.location.href = `/space?id=${space.id}`;
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${space.color}`} />
                  <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                    {space.name}
                  </h3>
                </div>
                <Button
                  className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  size="sm"
                  variant="ghost"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="relative inset-0 min-h-52 min-w-64 overflow-hidden rounded-lg border border-border/30 bg-muted/30">
                <Tldraw
                  cameraOptions={{
                    constraints: {
                      initialZoom: "fit-min",
                      bounds: {
                        x: 0,
                        y: 0,
                        w: 9000,
                        h: 9000,
                      },
                      baseZoom: "fit-min",
                      behavior: "fixed",
                      origin: {
                        x: 0,
                        y: 0,
                      },
                      padding: {
                        x: 0.1,
                        y: 0.1,
                      },
                    },
                  }}
                  className="min-h-52"
                  hideUi
                  onMount={(editor) => {
                    editor.updateInstanceState({ isReadonly: true });
                  }}
                  snapshot={JSON.parse(space.snapshotText).document}
                />
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between pt-0 text-muted-foreground text-sm">
              <span>{space.itemCount} items</span>
              <span>Edited {space.lastEdited}</span>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State (when no spaces exist) */}
      {!spacesQuery.isLoading && spaces.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-semibold text-foreground text-lg">
            No spaces yet
          </h3>
          <p className="mb-4 max-w-sm text-muted-foreground">
            Create your first space to start organizing your thoughts and ideas
            visually.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Space
          </Button>
        </div>
      )}
    </div>
  );
}
