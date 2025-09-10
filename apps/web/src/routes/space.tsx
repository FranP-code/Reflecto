import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createTLStore,
  defaultShapeUtils,
  getSnapshot,
  loadSnapshot,
  type TLStoreWithStatus,
  Tldraw,
  type TLComponents,
  DefaultToolbar,
  DefaultToolbarContent,
  useEditor,
} from "tldraw";
import { z } from "zod";
import "tldraw/tldraw.css";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  getLatestSpaceSnapshot,
  type RemoteSnapshot,
  upsertSpaceSnapshot,
} from "@/lib/appwrite-db";
import { authClient } from "@/lib/auth-client";
import { AIImageShapeUtil, AITextResultShapeUtil } from "@/lib/tldraw/ai-shapes";
import { createImageShapeFromFile, setupFileDropHandler, generateText } from "@/lib/tldraw/processing";
import { createAITextResult } from "@/lib/tldraw/ai-shapes";
import { KnowledgeGraphManager } from "@/lib/tldraw/knowledge-graph";
import { Camera, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const store = useMemo(
    () =>
      createTLStore({
        shapeUtils: [...defaultShapeUtils, AIImageShapeUtil, AITextResultShapeUtil],
      }),
    []
  );

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

  // Provide a custom Toolbar that injects our upload buttons into the bottom toolbar
  const components: TLComponents = {
    Toolbar: (props) => {
      const editor = useEditor();
      const [promptOpen, setPromptOpen] = useState(false);
      const [promptText, setPromptText] = useState("");
      const [temperature, setTemperature] = useState(0.7);
      const [isGenLoading, setIsGenLoading] = useState(false);
      const [genError, setGenError] = useState<string | null>(null);

      async function pickImageFile(): Promise<File | null> {
        try {
          if ("showOpenFilePicker" in window) {
            const picker = await (window as any).showOpenFilePicker({
              multiple: false,
              types: [{ description: "Images", accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] } }],
              excludeAcceptAllOption: false,
            });
            const file = await picker[0]?.getFile();
            return file ?? null;
          }
        } catch { }
        return new Promise<File | null>((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.style.position = "fixed";
          input.style.left = "-10000px";
          document.body.appendChild(input);
          const cleanup = () => input.remove();
          input.addEventListener(
            "change",
            () => {
              const f = input.files?.[0] ?? null;
              cleanup();
              resolve(f);
            },
            { once: true }
          );
          input.click();
        });
      }

      const handlePickImage = async () => {
        const file = await pickImageFile();
        if (!file) return;
        const { x, y, w, h } = editor.getViewportPageBounds();
        await createImageShapeFromFile(editor, file, { x: x + w / 2, y: y + h / 2 });
      };

      const handleOpenPrompt = () => {
        setPromptText("");
        setGenError(null);
        setTemperature(0.7);
        setPromptOpen(true);
      };

      const handleGenerateFromDialog = async () => {
        if (!promptText.trim()) return;
        setIsGenLoading(true);
        setGenError(null);
        try {
          let text = await generateText(promptText, temperature);
          text = text.trim();
          // Center position
          const { x, y, w, h } = editor.getViewportPageBounds();
          const cx = x + w / 2;
          const cy = y + h / 2;
          const textShapeId = createAITextResult(editor, {
            fromShapeId: null,
            sourceType: "prompt",
            content: text,
            x: cx,
            y: cy,
          });
          // Analyze connections
          const kg = new KnowledgeGraphManager(editor);
          await kg.analyzeConnections(textShapeId);
          setPromptOpen(false);
        } catch (e: any) {
          setGenError(e?.message ?? "Failed to generate text");
        } finally {
          setIsGenLoading(false);
        }
      };

      return (
        <DefaultToolbar {...props}>
          {/* Custom actions group at the start (left) of the toolbar */}
          <div className="mx-1" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Tooltip>
              <TooltipTrigger>
                <Button type="button" onClick={handlePickImage}>
                  <Camera />
                </Button>
              </TooltipTrigger >
              <TooltipContent>Upload Image (OCR)</TooltipContent>
            </Tooltip>

            <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
              <Tooltip>
                <TooltipTrigger>
                  <Button type="button" onClick={handleOpenPrompt}>
                    <Sparkles />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Generate Text</TooltipContent>
              </Tooltip>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Text</DialogTitle>
                  <DialogDescription>Enter a prompt to generate AI text. The result will be inserted on the canvas.</DialogDescription>
                </DialogHeader>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Write your prompt..."
                    style={{
                      minHeight: 120,
                      resize: "vertical",
                      width: "100%",
                      border: "1px solid #ced4da",
                      borderRadius: 6,
                      padding: 8,
                      lineHeight: 1.4,
                      outline: "none",
                    }}
                  />
                  <label style={{ fontSize: 12, }}>Temperature: {temperature.toFixed(2)}</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                  {genError ? (
                    <div style={{ color: "#a4000f", fontSize: 12 }}>{genError}</div>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setPromptOpen(false)} disabled={isGenLoading}>Cancel</Button>
                  <Button type="button" onClick={handleGenerateFromDialog} disabled={isGenLoading || !promptText.trim()}>
                    {isGenLoading ? "Generating..." : "Generate"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {/* Separator */}
          <div style={{ borderRight: "1px solid #888", height: "30px", margin: "0 8px" }} />
          <DefaultToolbarContent />
        </DefaultToolbar>
      );
    },
  };

  return (
    <div className="mx-4 mt-4" style={{ position: "relative", inset: 0 }}>
      <Tldraw
        onMount={(editor) => {
          editor.user.updateUserPreferences({ colorScheme: "dark" });
          // Expose editor for helper UI
          (window as any).editor = editor;
          // Prompt generator handled via toolbar dialog

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

          // Setup drag & drop for images/audio -> AI shapes
          const teardownDrop = setupFileDropHandler(editor);

          // Cleanup listener on unmount
          return () => {
            unlisten();
            window.clearTimeout(timeout);
            // Remove DnD handlers
            if (typeof teardownDrop === "function") teardownDrop();
            (window as any).editor = undefined;
          };
        }}
        shapeUtils={[...defaultShapeUtils, AIImageShapeUtil, AITextResultShapeUtil]}
        store={storeWithStatus}
        components={components}
      />
    </div>
  );
}
// Removed absolute-positioned overlay; actions are now inside the bottom toolbar via components.Toolbar
