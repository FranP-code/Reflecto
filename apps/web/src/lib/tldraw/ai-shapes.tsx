import type { RecordProps, TLBaseShape, TLResizeInfo } from "tldraw";
import {
  createShapeId,
  HTMLContainer,
  Rectangle2d,
  resizeBox,
  ShapeUtil,
  T,
} from "tldraw";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { stopEventPropagation } from "tldraw";

// Types
export type AIImageShape = TLBaseShape<
  "ai-image",
  {
    imageUrl: string;
    extractedText: string;
    processingStatus: "idle" | "processing" | "completed" | "error";
    filename: string;
    uploadDate: number;
    w: number;
    h: number;
  }
>;
// New: AI Prompt shape
export type AIPromptShape = TLBaseShape<
  "ai-prompt",
  {
    prompt: string;
    status: "idle" | "processing" | "completed" | "error";
    createdDate: number;
    w: number;
    h: number;
    temperature: number;
  }
>;

export class AIPromptShapeUtil extends ShapeUtil<AIPromptShape> {
  static override type = "ai-prompt" as const;

  static override props: RecordProps<AIPromptShape> = {
    prompt: T.string,
    status: T.literalEnum("idle", "processing", "completed", "error"),
    createdDate: T.number,
    w: T.number,
    h: T.number,
    temperature: T.number,
  };

  getDefaultProps(): AIPromptShape["props"] {
    return {
      prompt: "",
      status: "idle",
      createdDate: Date.now(),
      w: 320,
      h: 180,
      temperature: 0.7,
    };
  }

  override canEdit() {
    return true;
  }
  override canResize() {
    return true;
  }
  override onResize(shape: AIPromptShape, info: TLResizeInfo<AIPromptShape>) {
    return resizeBox(shape, info);
  }

  getGeometry(shape: AIPromptShape) {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true });
  }

  component(shape: AIPromptShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const [temp, setTemp] = useState(shape.props.temperature);
    useEffect(() => setTemp(shape.props.temperature), [shape.props.temperature]);

    const triggerGenerate = () => {
      try {
        (window as any).__aiGenerate?.(shape.id);
      } catch {}
    };

    return (
      <HTMLContainer id={shape.id} style={{ pointerEvents: "all" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "2px solid #6f42c1",
            borderRadius: 8,
            padding: 12,
            backgroundColor: "#fff",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "#6f42c1" }}>✨ AI Prompt</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color:
                  shape.props.status === "processing"
                    ? "#b08500"
                    : shape.props.status === "completed"
                      ? "#0b6b3a"
                      : shape.props.status === "error"
                        ? "#a4000f"
                        : "#495057",
              }}
            >
              {shape.props.status}
            </span>
          </div>
          <textarea
            value={shape.props.prompt}
            onChange={(e) =>
              this.editor.updateShape({ id: shape.id, type: "ai-prompt", props: { prompt: e.target.value } })
            }
            placeholder="Write your prompt..."
            style={{
              flex: "1 1 0%",
              minHeight: 0,
              resize: "none",
              width: "100%",
              border: "1px solid #ced4da",
              borderRadius: 6,
              padding: 8,
              lineHeight: 1.4,
              color: "#212529",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, color: "#495057" }}>Temp</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              onMouseUp={() =>
                this.editor.updateShape({ id: shape.id, type: "ai-prompt", props: { temperature: temp } })
              }
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={triggerGenerate}
              disabled={shape.props.status === "processing" || !shape.props.prompt.trim()}
              style={{
                padding: "6px 10px",
                backgroundColor: "#6f42c1",
                color: "#fff",
                border: 0,
                borderRadius: 6,
                cursor: shape.props.status === "processing" || !shape.props.prompt.trim() ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              Generate
            </button>
          </div>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: AIPromptShape) {
    return <rect height={shape.props.h} width={shape.props.w} />;
  }
}

export type AITextResultShape = TLBaseShape<
  "ai-text-result",
  {
    content: string;
    sourceType: "image" | "analysis" | "prompt";
    sourceShapeId: string;
    createdDate: number;
    w: number;
    h: number;
  }
>;

// Utils
export class AIImageShapeUtil extends ShapeUtil<AIImageShape> {
  static override type = "ai-image" as const;

  static override props: RecordProps<AIImageShape> = {
    imageUrl: T.string,
    extractedText: T.string,
    processingStatus: T.literalEnum("idle", "processing", "completed", "error"),
    filename: T.string,
    uploadDate: T.number,
    w: T.number,
    h: T.number,
  };

  getDefaultProps(): AIImageShape["props"] {
    return {
      imageUrl: "",
      extractedText: "",
      processingStatus: "idle",
      filename: "",
      uploadDate: Date.now(),
      w: 300,
      h: 200,
    };
  }

  override canEdit() {
    return false;
  }
  override canResize() {
    return true;
  }
  override onResize(shape: AIImageShape, info: TLResizeInfo<AIImageShape>) {
    return resizeBox(shape, info);
  }

  getGeometry(shape: AIImageShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  component(shape: AIImageShape) {
    const [showStatus, setShowStatus] = useState(true);
    const status = shape.props.processingStatus;
    useEffect(() => {
      // Always show while idle/processing; hide after 2s when completed/error
      if (status === "completed" || status === "error") {
        setShowStatus(true);
        const t = setTimeout(() => setShowStatus(false), 5000);
        return () => clearTimeout(t);
      }
      setShowStatus(true);
      return undefined;
    }, [status]);

    return (
      <HTMLContainer>
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "2px solid #e1e5e9",
            borderRadius: 8,
            overflow: "hidden",
            backgroundColor: "#f8f9fa",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: "1 1 0%", minHeight: 0 }}>
            {shape.props.imageUrl ? (
              <img
                alt={shape.props.filename || "Upload preview"}
                src={shape.props.imageUrl}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : null}
          </div>
          {showStatus ? (
            <div
              style={{
                padding: 8,
                backgroundColor:
                  status === "processing"
                    ? "#b08500" // dark amber
                    : status === "completed"
                      ? "#0b6b3a" // dark green
                      : status === "error"
                        ? "#a4000f" // dark red
                        : "#495057", // neutral dark
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {status === "processing" && "Processing with OCR..."}
              {status === "completed" && "Text extracted"}
              {status === "error" && "Processing failed"}
              {status === "idle" && "Ready for processing"}
            </div>
          ) : null}
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: AIImageShape) {
    return <rect height={shape.props.h} width={shape.props.w} />;
  }
}

export class AITextResultShapeUtil extends ShapeUtil<AITextResultShape> {
  static override type = "ai-text-result" as const;

  static override props: RecordProps<AITextResultShape> = {
    content: T.string,
    sourceType: T.literalEnum("image", "analysis", "prompt"),
    sourceShapeId: T.string,
    createdDate: T.number,
    w: T.number,
    h: T.number,
  };

  getDefaultProps(): AITextResultShape["props"] {
    return {
      content: "",
      sourceType: "image",
      sourceShapeId: "",
      createdDate: Date.now(),
      w: 280,
      h: 150,
    };
  }

  override canEdit() {
    return true;
  }

  override canResize() {
    return true;
  }

  override onResize(shape: AITextResultShape, info: TLResizeInfo<AITextResultShape>) {
    return resizeBox(shape, info);
  }

  getGeometry(shape: AITextResultShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  component(shape: AITextResultShape) {
    // Follow editable-shape pattern: rely on editor's editing state
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const headerRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
      if (isEditing && textareaRef.current) textareaRef.current.focus();
    }, [isEditing]);

    // Ensure textarea grows with content while editing
    useLayoutEffect(() => {
      if (!isEditing) return;
      const ta = textareaRef.current;
      if (!ta) return;
      // Reset then set to scrollHeight for accurate sizing
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }, [isEditing, shape.props.content]);

    // Auto-size to content: measure and adjust height once per content/editing change
    const autosizeAppliedRef = useRef<{ content: string; editing: boolean } | null>(null);
    const autosizePassRef = useRef(0);
    const roRef = useRef<ResizeObserver | null>(null);
    useLayoutEffect(() => {
      const prev = autosizeAppliedRef.current;
      if (prev && prev.content === shape.props.content && prev.editing === isEditing) return;

      const rootEl = rootRef.current;
      if (!rootEl) return;

      // Defer measurement to ensure layout is final
      const measureAndUpdate = () => {
        const minH = 100;
        // If editing, size to textarea content + header/padding precisely
        if (isEditing && textareaRef.current && headerRef.current) {
          const ta = textareaRef.current as HTMLTextAreaElement;
          const headerH = Math.ceil(headerRef.current.getBoundingClientRect().height);
          // Ensure textarea is sized to its content before measuring
          const prevTaHeight = ta.style.height;
          ta.style.height = "auto";
          const taH = Math.ceil(ta.scrollHeight);
          ta.style.height = prevTaHeight || `${taH}px`;
          const padding = 24; // 12 top + 12 bottom
          const marginBetween = 8; // header bottom margin
          const headerDivider = 1; // 1px border-bottom
          const borderY = 4; // 2px top + 2px bottom on card
          const desiredH = Math.max(minH, headerH + marginBetween + taH + padding + headerDivider + borderY);
          const dh = Math.abs(desiredH - shape.props.h);
          if (dh > 2) {
            this.editor.updateShape({ id: shape.id, type: "ai-text-result", props: { h: desiredH } });
            return true;
          }
          return false;
        }

        // Non-editing: measure the entire card's natural height at the current width
        const prevWidth = rootEl.style.width;
        const prevHeight = rootEl.style.height;
        rootEl.style.width = `${Math.max(120, Math.floor(shape.props.w))}px`;
        rootEl.style.height = "auto"; // let it expand naturally for measurement
        const cardH = Math.ceil(rootEl.scrollHeight);
        // restore styles
        rootEl.style.width = prevWidth;
        rootEl.style.height = prevHeight;

        const finalH = Math.max(minH, cardH);
        const dh = Math.abs(finalH - shape.props.h);
        if (dh > 2) {
          this.editor.updateShape({ id: shape.id, type: "ai-text-result", props: { h: finalH } });
          return true;
        }
        return false;
      };

      const raf1 = requestAnimationFrame(() => {
        const updated = measureAndUpdate();
        if (updated && autosizePassRef.current < 1) {
          autosizePassRef.current += 1;
          requestAnimationFrame(() => {
            measureAndUpdate();
            autosizeAppliedRef.current = { content: shape.props.content, editing: isEditing };
            autosizePassRef.current = 0;
          });
        } else {
          autosizeAppliedRef.current = { content: shape.props.content, editing: isEditing };
          autosizePassRef.current = 0;
        }

        // Safety: for very fresh shapes, fonts/layout may settle a bit later.
        // If the shape was created recently, schedule a delayed re-measure.
        const now = Date.now();
        const created = (shape.props as any)?.createdDate ?? now;
        if (now - created < 1500) {
          setTimeout(() => {
            measureAndUpdate();
          }, 120);
          setTimeout(() => {
            measureAndUpdate();
          }, 300);
        }
      });
      return () => {
        cancelAnimationFrame(raf1);
      };
    }, [isEditing, shape.id, shape.props.content]);

    // Observe late layout changes and re-measure once if needed (e.g., fonts settling)
    useLayoutEffect(() => {
      const rootEl = rootRef.current;
      if (!rootEl) return;
      // Clean up any previous observer
      roRef.current?.disconnect();
      let fired = 0;
      const ro = new ResizeObserver(() => {
        if (fired > 1) return; // at most two extra passes
        fired += 1;
        requestAnimationFrame(() => {
          // trigger a measure without changing the content/editing token
          const minH = 100;
          if (isEditing && textareaRef.current && headerRef.current) {
            const ta = textareaRef.current as HTMLTextAreaElement;
            const headerH = Math.ceil(headerRef.current.getBoundingClientRect().height);
            const prevTaHeight = ta.style.height;
            ta.style.height = 'auto';
            const taH = Math.ceil(ta.scrollHeight);
            ta.style.height = prevTaHeight || `${taH}px`;
            const padding = 24, marginBetween = 8, headerDivider = 1, borderY = 4;
            const desiredH = Math.max(minH, headerH + marginBetween + taH + padding + headerDivider + borderY);
            const dh = Math.abs(desiredH - shape.props.h);
            if (dh > 2) this.editor.updateShape({ id: shape.id, type: 'ai-text-result', props: { h: desiredH } });
          } else {
            const prevWidth = rootEl.style.width;
            const prevHeight = rootEl.style.height;
            rootEl.style.width = `${Math.max(120, Math.floor(shape.props.w))}px`;
            rootEl.style.height = 'auto';
            const cardH = Math.ceil(rootEl.scrollHeight);
            rootEl.style.width = prevWidth;
            rootEl.style.height = prevHeight;
            const finalH = Math.max(minH, cardH);
            const dh = Math.abs(finalH - shape.props.h);
            if (dh > 2) this.editor.updateShape({ id: shape.id, type: 'ai-text-result', props: { h: finalH } });
          }
        });
      });
      ro.observe(rootEl);
      roRef.current = ro;
      return () => {
        ro.disconnect();
      };
    }, [isEditing, shape.id, shape.props.content]);

    const header =
      shape.props.sourceType === "image"
        ? "📄 OCR Result"
        : shape.props.sourceType === "prompt"
          ? "✨ AI Generation"
          : "🧠 AI Analysis";

    return (
      <HTMLContainer
        id={shape.id}
        onPointerDown={isEditing ? stopEventPropagation : undefined}
        style={{ pointerEvents: isEditing ? "all" : "none" }}
      >
        <div
          ref={rootRef}
          style={{
            boxSizing: "border-box",
            width: "100%",
            height: "100%",
            border: "2px solid #28a745",
            borderRadius: 8,
            padding: 12,
            backgroundColor: "#fff",
            fontSize: 12,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            ref={headerRef}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              paddingBottom: 4,
              borderBottom: "1px solid #e9ecef",
            }}
          >
            <span style={{ fontWeight: 700, color: "#28a745" }}>{header}</span>
          
          </div>

          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={shape.props.content}
              onChange={(e) =>
                this.editor.updateShape({
                  id: shape.id,
                  type: "ai-text-result",
                  props: { content: e.target.value },
                })
              }
              onInput={(e) => {
                const ta = e.currentTarget;
                ta.style.height = "auto";
                ta.style.height = `${ta.scrollHeight}px`;
              }}
              aria-label="Edit extracted text"
              style={{
                boxSizing: "border-box",
                flex: "0 0 auto",
                minHeight: 0,
                height: "auto",
                resize: "none",
                width: "100%",
                border: "1px solid #ced4da",
                borderRadius: 6,
                padding: 8,
                lineHeight: 1.4,
                color: "#212529",
                outline: "none",
                overflow: "hidden",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
              placeholder="Edit extracted content..."
            />
          ) : (
            <div
              ref={contentRef}
              style={{
                boxSizing: "border-box",
                flex: "0 0 auto",
                minHeight: 0,
                lineHeight: 1.4,
                color: "#495057",
                whiteSpace: "pre-wrap",
                cursor: "text",
                overflow: "hidden",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {shape.props.content || "No content extracted"}
            </div>
          )}
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: AITextResultShape) {
    return <rect height={shape.props.h} width={shape.props.w} />;
  }
}

export function createAITextResult(
  editor: any,
  opts: {
    fromShapeId: string | null;
    sourceType: "image" | "analysis" | "prompt";
    content: string;
    x: number;
    y: number;
  }
) {
  const id = createShapeId();
  const baseW = 280;
  const baseH = 100;
  // Width estimate from longest line length (rough char width ~7px at 12px font)
  const lines = (opts.content || "").split(/\r?\n/);
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const approxInner = Math.max(baseW - 24 - 4, Math.min(520, Math.floor(longest * 7)));
  const dynW = Math.max(240, Math.min(640, approxInner + 24 + 4));
  // Rough estimate: assume ~42 chars per line at this width & font, 18px line-height
  const charsPerLine = 42;
  const estLines = Math.max(2, Math.ceil((opts.content?.length ?? 0) / charsPerLine));
  const headerAndChrome = 60; // header + divider + margins
  const padding = 24; // vertical padding
  const estH = headerAndChrome + estLines * 18 + padding;
  // Precise pre-measure using offscreen DOM (when available)
  let dynH = Math.max(baseH, Math.min(480, estH));
  try {
    const innerW = Math.max(120, Math.floor(dynW - 24 - 4));
    const clone = document.createElement("div");
    clone.style.position = "absolute";
    clone.style.left = "-10000px";
    clone.style.top = "-10000px";
    clone.style.visibility = "hidden";
    clone.style.pointerEvents = "none";
    clone.style.whiteSpace = "pre-wrap";
    clone.style.lineHeight = "1.4";
    clone.style.fontSize = "12px"; // matches card body
    clone.style.fontFamily = "inherit";
    clone.style.width = `${innerW}px`;
    clone.textContent = opts.content || "";
    document.body.appendChild(clone);
    const contentH = Math.ceil(clone.getBoundingClientRect().height);
    clone.remove();
    if (contentH) {
      const borderY = 4; // 2px + 2px
      const marginBetween = 8; // header bottom margin
      const headerApprox = 28; // header line height approx
      const divider = 1;
      const chrome = headerApprox + divider + marginBetween;
      const precise = chrome + padding + contentH + borderY;
      dynH = Math.max(baseH, Math.min(640, precise));
    }
  } catch {
    // ignore and use heuristic
  }
  editor.createShape({
    id,
    type: "ai-text-result",
    x: opts.x,
    y: opts.y,
    props: {
      content: opts.content,
      sourceType: opts.sourceType,
      sourceShapeId: opts.fromShapeId ?? "",
      createdDate: Date.now(),
      w: dynW,
      h: dynH,
    },
  });
  return id;
}
