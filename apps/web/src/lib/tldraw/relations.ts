import { generateText } from "./processing";
import { KnowledgeGraphManager } from "./knowledge-graph";
import { createAITextResult } from "./ai-shapes";

export function normalizeShapeHeight(editor: any, shapeId: string) {
  try {
    const measure = () => {
      const el = document.getElementById(shapeId);
      if (!el) return false;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return false;
      const width = Math.ceil(card.clientWidth);
      if (!width) return false; // wait until it has layout width
      const prevH = card.style.height;
      card.style.height = "auto";
      const measured = Math.ceil(card.scrollHeight);
      card.style.height = prevH;
      if (measured && Number.isFinite(measured)) {
        const shape = editor.getShape(shapeId);
        const minH = 100;
        const finalH = Math.max(minH, measured);
        if (Math.abs((shape?.props?.h ?? 0) - finalH) > 2) {
          editor.updateShape({ id: shapeId, type: "ai-text-result", props: { h: finalH } });
        }
        return true;
      }
      return false;
    };

    // Try up to ~8 frames for a stable width & layout
    let tries = 0;
    const tick = () => {
      if (measure()) return;
      if (tries++ > 8) return;
      requestAnimationFrame(() => setTimeout(tick, 0));
    };
    setTimeout(() => requestAnimationFrame(tick), 0);

    // Extra late fallback in case fonts/style settle late
    setTimeout(() => {
      measure();
    }, 50);
  } catch {
    // ignore measurement errors
  }
}

/**
 * Sets up observers to automatically re-run height normalization for
 * `ai-text-result` shapes whenever their DOM nodes appear and intersect
 * the viewport. This fixes the issue where offscreen virtualized shapes
 * come back into view with stale heights.
 *
 * Returns a teardown function to disconnect observers on unmount.
 */
export function setupHeightAutoNormalize(editor: any): () => void {
  try {
    // Track current ai-text-result ids to avoid observing unrelated nodes
    const isTextResultId = (id: string) => {
      const s = editor.getShape(id);
      return !!s && s.type === "ai-text-result";
    };

    const observed = new Set<string>();
    const pendingScan = { v: false };

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target as HTMLElement;
        const id = target.id;
        if (!id || !isTextResultId(id)) continue;
        // Defer a tick so layout fully stabilizes
        requestAnimationFrame(() => normalizeShapeHeight(editor, id));
      }
    }, { root: null, threshold: 0.01 });

    const tryObserve = (id: string) => {
      if (!id || observed.has(id)) return;
      if (!isTextResultId(id)) return;
      const el = document.getElementById(id);
      if (!el) return;
      try {
        io.observe(el);
        observed.add(id);
      } catch { /* ignore */ }
    };

    const scanAll = () => {
      pendingScan.v = false;
      try {
        const ids: string[] = editor.getCurrentPageShapeIds?.() ?? [];
        for (const id of ids) tryObserve(id);
      } catch { /* ignore */ }
    };

    // Mutation observer to catch when TLDraw mounts/unmounts DOM nodes
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "childList") {
          // Schedule a batched scan soon after DOM changes
          if (!pendingScan.v) {
            pendingScan.v = true;
            setTimeout(scanAll, 0);
          }
        }
      }
    });

    try {
      mo.observe(document.body, { childList: true, subtree: true });
    } catch { /* ignore */ }

    // Initial scan and a delayed rescan for late fonts/styles
    scanAll();
    setTimeout(scanAll, 300);

    // Also rescan when the document changes (e.g., shapes added/removed)
    const unlisten = editor.store?.listen?.(() => {
      if (!pendingScan.v) {
        pendingScan.v = true;
        setTimeout(scanAll, 0);
      }
    }, { scope: "document" });

    return () => {
      try { io.disconnect(); } catch { /* ignore */ }
      try { mo.disconnect(); } catch { /* ignore */ }
      try { unlisten?.(); } catch { /* ignore */ }
      observed.clear();
    };
  } catch {
    // Fallback no-op teardown
    return () => {};
  }
}

export function extractTextContentFromShape(editor: any, shape: any): string {
  if (!shape) return "";
  if (shape.type === "ai-text-result") return shape.props?.content ?? "";
  if (shape.type === "ai-image") return shape.props?.extractedText ?? "";
  if (shape.type === "text" || shape.type === "note") return shape.props?.text ?? "";
  return "";
}

export async function generateRelationText(textA: string, textB: string): Promise<string> {
  const userPrompt = [
    "Given two short texts, write a brief plain-text relation between them.",
    "One line only. No markdown, no lists, no headings.",
    "Return only the relation phrase/sentence.",
    "Without making a mention of Text A and Text B.",
    "Just a relation phrase/sentence between the two texts and an explanation.",
    "",
    `Text A: "${textA}"`,
    `Text B: "${textB}"`,
  ].join("\n");
  const text = await generateText(userPrompt, 0.4);
  return (text ?? "").trim();
}

export function midpointBetweenShapes(editor: any, aId: string, bId: string): { x: number; y: number } {
  const aBounds = editor.getShapePageBounds(aId);
  const bBounds = editor.getShapePageBounds(bId);
  const aShape = editor.getShape(aId);
  const bShape = editor.getShape(bId);
  const acx = aBounds ? aBounds.x + aBounds.w / 2 : (aShape?.x ?? 0);
  const acy = aBounds ? aBounds.y + aBounds.h / 2 : (aShape?.y ?? 0);
  const bcx = bBounds ? bBounds.x + bBounds.w / 2 : (bShape?.x ?? 0);
  const bcy = bBounds ? bBounds.y + bBounds.h / 2 : (bShape?.y ?? 0);
  const midx = (acx + bcx) / 2;
  const midy = (acy + bcy) / 2;
  const dx = bcx - acx;
  const dy = bcy - acy;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular unit vector
  const px = -dy / len;
  const py = dx / len;
  const offset = Math.min(120, Math.max(40, len * 0.12));
  return { x: midx + px * offset, y: midy + py * offset };
}

export async function insertRelationBetweenShapes(
  editor: any,
  aId: string,
  bId: string,
  relationText: string
) {
  const aBounds = editor.getShapePageBounds(aId);
  const bBounds = editor.getShapePageBounds(bId);
  const aShape = editor.getShape(aId);
  const bShape = editor.getShape(bId);
  const acx = aBounds ? aBounds.x + aBounds.w / 2 : (aShape?.x ?? 0);
  const acy = aBounds ? aBounds.y + aBounds.h / 2 : (aShape?.y ?? 0);
  const bcx = bBounds ? bBounds.x + bBounds.w / 2 : (bShape?.x ?? 0);
  const bcy = bBounds ? bBounds.y + bBounds.h / 2 : (bShape?.y ?? 0);
  const dx = bcx - acx;
  const dy = bcy - acy;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;

  let baseOffset = Math.min(120, Math.max(40, len * 0.12));
  let pos = { x: (acx + bcx) / 2 + px * baseOffset, y: (acy + bcy) / 2 + py * baseOffset };

  let relationId = "";
  editor.batch?.(() => {
    relationId = createAITextResult(editor, {
      fromShapeId: null,
      sourceType: "analysis",
      content: relationText.trim(),
      x: pos.x,
      y: pos.y,
    });

    // Force a first-paint normalize for the relation card height
    normalizeShapeHeight(editor, relationId);

    // Nudge relation to avoid overlap with A or B (up to 2 passes)
    for (let i = 0; i < 2; i++) {
      const relBounds = editor.getShapePageBounds(relationId);
      if (!relBounds) break;
      const overlapsA = aBounds && !(relBounds.x > aBounds.x + aBounds.w || relBounds.x + relBounds.w < aBounds.x || relBounds.y > aBounds.y + aBounds.h || relBounds.y + relBounds.h < aBounds.y);
      const overlapsB = bBounds && !(relBounds.x > bBounds.x + bBounds.w || relBounds.x + relBounds.w < bBounds.x || relBounds.y > bBounds.y + bBounds.h || relBounds.y + relBounds.h < bBounds.y);
      if (overlapsA || overlapsB) {
        baseOffset = Math.min(200, Math.floor(baseOffset * 1.5));
        pos = { x: (acx + bcx) / 2 + px * baseOffset, y: (acy + bcy) / 2 + py * baseOffset };
        editor.updateShape({ id: relationId, type: "ai-text-result", x: pos.x, y: pos.y });
      } else {
        break;
      }
    }

    const kg = new KnowledgeGraphManager(editor);
    // Both arrows point into the relation shape: a -> relation, b -> relation
    kg.createConnection(aId, relationId, "relates_to");
    kg.createConnection(bId, relationId, "relates_to");
  });
  return relationId;
}
