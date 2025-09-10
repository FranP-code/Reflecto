import type { RecordProps, TLBaseShape, TLResizeInfo } from "tldraw";
import {
  createShapeId,
  HTMLContainer,
  Rectangle2d,
  resizeBox,
  ShapeUtil,
  T,
} from "tldraw";
import { useEffect, useRef, useState } from "react";
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

export type AITextResultShape = TLBaseShape<
  "ai-text-result",
  {
    content: string;
    sourceType: "image" | "analysis";
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
    sourceType: T.literalEnum("image", "analysis"),
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

    useEffect(() => {
      if (isEditing && textareaRef.current) textareaRef.current.focus();
    }, [isEditing]);

    // Auto-size to content: measure and adjust w/h
    useEffect(() => {
      const headerEl = headerRef.current;
      const contentEl = isEditing ? (textareaRef.current as HTMLElement | null) : contentRef.current;
      
      console.log({
        headerEl,
contentEl
      })
      if (!headerEl || !contentEl) return;

      // Measure desired sizes
      const headerH = Math.ceil(headerEl.getBoundingClientRect().height);
      const contentH = Math.ceil((contentEl as HTMLElement).scrollHeight);
      const contentW = Math.ceil((contentEl as HTMLElement).scrollWidth);

      if (!contentH || !contentW) return;

      const padding = 24; // root padding 12 top + 12 bottom
      const marginBetween = 8; // header bottom margin

      const minW = 220;
      const minH = 120;

      const desiredW = Math.max(minW, contentW + padding);
      const desiredH = Math.max(minH, headerH + marginBetween + contentH + padding);

      // Avoid tight loops: only update if significant delta
      const dw = Math.abs(desiredW - shape.props.w);
      const dh = Math.abs(desiredH - shape.props.h);
      if (dw > 1 || dh > 1) {
        this.editor.updateShape({
          id: shape.id,
          type: "ai-text-result",
          props: { w: desiredW, h: desiredH },
        });
      }
    }, [isEditing, shape.id, shape.props.content, shape.props.w, shape.props.h]);

    const header =
      shape.props.sourceType === "image"
        ? "📄 OCR Result"
        : "🧠 AI Analysis";

    return (
      <HTMLContainer
        id={shape.id}
        onPointerDown={isEditing ? stopEventPropagation : undefined}
        style={{ pointerEvents: isEditing ? "all" : "none" }}
      >
        <div
          style={{
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
              aria-label="Edit extracted text"
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
                overflow: "hidden"
              }}
              placeholder="Edit extracted content..."
            />
          ) : (
            <div
              ref={contentRef}
              style={{
                flex: "1 1 0%",
                minHeight: 0,
                lineHeight: 1.4,
                color: "#495057",
                whiteSpace: "pre-wrap",
                cursor: "text",
                overflow: "hidden"
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
    fromShapeId: string;
    sourceType: "image" | "analysis";
    content: string;
    x: number;
    y: number;
  }
) {
  const id = createShapeId();
  const baseW = 280;
  const baseH = 150;
  const extra = Math.min(600, Math.floor(opts.content.length / 6));
  const dynW = Math.min(640, baseW + Math.floor(extra * 0.6));
  const dynH = Math.min(480, baseH + Math.floor(extra * 0.4));
  editor.createShape({
    id,
    type: "ai-text-result",
    x: opts.x,
    y: opts.y,
    props: {
      content: opts.content,
      sourceType: opts.sourceType,
      sourceShapeId: opts.fromShapeId,
      createdDate: Date.now(),
      w: dynW,
      h: dynH,
    },
  });
  return id;
}
