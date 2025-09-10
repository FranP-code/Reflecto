import { createShapeId } from "tldraw";

export class KnowledgeGraphManager {
  constructor(private editor: any) {}

  createConnection(
    fromShapeId: string,
    toShapeId: string,
    relationshipType: string,
  ) {
    const arrowId = createShapeId();
    // Compute centers to place arrow endpoints
    const fromBounds = this.editor.getShapePageBounds(fromShapeId);
    const toBounds = this.editor.getShapePageBounds(toShapeId);
    const fromShape = this.editor.getShape(fromShapeId);
    const toShape = this.editor.getShape(toShapeId);
    const fcx = fromBounds
      ? fromBounds.x + fromBounds.w / 2
      : (fromShape?.x ?? 0);
    const fcy = fromBounds
      ? fromBounds.y + fromBounds.h / 2
      : (fromShape?.y ?? 0);
    const tcx = toBounds ? toBounds.x + toBounds.w / 2 : (toShape?.x ?? 0);
    const tcy = toBounds ? toBounds.y + toBounds.h / 2 : (toShape?.y ?? 0);
    const dx = tcx - fcx;
    const dy = tcy - fcy;
    // Decide which sides to attach based on angle
    const fromPoint = (() => {
      if (!fromBounds) return { x: fcx, y: fcy };
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (adx > ady) {
        // horizontal connect
        return dx >= 0
          ? { x: fromBounds.x + fromBounds.w, y: fcy }
          : { x: fromBounds.x, y: fcy };
      }
      // vertical connect
      return dy >= 0
        ? { x: fcx, y: fromBounds.y + fromBounds.h }
        : { x: fcx, y: fromBounds.y };
    })();
    const toPoint = (() => {
      if (!toBounds) return { x: tcx, y: tcy };
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (adx > ady) {
        return dx >= 0
          ? { x: toBounds.x, y: tcy }
          : { x: toBounds.x + toBounds.w, y: tcy };
      }
      return dy >= 0
        ? { x: tcx, y: toBounds.y }
        : { x: tcx, y: toBounds.y + toBounds.h };
    })();

    this.editor.createShape({
      id: arrowId,
      type: "arrow",
      props: { start: fromPoint, end: toPoint },
      meta: {
        relationshipType,
        aiGenerated: true,
        createdAt: Date.now(),
      },
    });
    // Bind arrow ends using normalized anchors for side-specific attachment
    const fromAnchor = (() => {
      if (!fromBounds) return { x: 0.5, y: 0.5 };
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (adx > ady) return dx >= 0 ? { x: 1, y: 0.5 } : { x: 0, y: 0.5 };
      return dy >= 0 ? { x: 0.5, y: 1 } : { x: 0.5, y: 0 };
    })();
    const toAnchor = (() => {
      if (!toBounds) return { x: 0.5, y: 0.5 };
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (adx > ady) return dx >= 0 ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 };
      return dy >= 0 ? { x: 0.5, y: 0 } : { x: 0.5, y: 1 };
    })();
    try {
      this.editor.createBindings([
        {
          fromId: arrowId,
          toId: fromShapeId,
          type: "arrow",
          props: {
            terminal: "start",
            normalizedAnchor: fromAnchor,
            isPrecise: true,
            isExact: false,
          },
        },
        {
          fromId: arrowId,
          toId: toShapeId,
          type: "arrow",
          props: {
            terminal: "end",
            normalizedAnchor: toAnchor,
            isPrecise: true,
            isExact: false,
          },
        },
      ]);
    } catch {
      // Fallback to simple bind if available
      try {
        this.editor.bindArrow(arrowId, "start", fromShapeId);
        this.editor.bindArrow(arrowId, "end", toShapeId);
      } catch {}
    }
    return arrowId;
  }

  async analyzeConnections(shapeId: string) {
    const shape = this.editor.getShape(shapeId);
    if (!shape) return;
    const allShapes = this.editor.getCurrentPageShapes();
    const textShapes = allShapes.filter(
      (s: any) =>
        (s.type === "ai-text-result" || s.type === "text" || s.type === "note") && s.id !== shapeId
    );

    const currentContent = this.extractTextContent(shape);
    if (!currentContent) return;

    for (const otherShape of textShapes) {
      const otherContent = this.extractTextContent(otherShape);
      if (!otherContent) continue;
      const similarity = this.calculateTextSimilarity(
        currentContent,
        otherContent
      );
      if (similarity > 0.3) {
        this.createConnection(
          shapeId,
          otherShape.id,
          "related_content",
        );
      }
    }
  }

  private extractTextContent(shape: any): string {
    if (shape.type === "ai-text-result") return shape.props.content;
    if (shape.type === "ai-image") return shape.props.extractedText;
  if (shape.type === "text" || shape.type === "note") return shape.props.text;
    return "";
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const set2 = new Set(words2);
    const intersection = words1.filter((w) => set2.has(w));
    const union = new Set([...words1, ...words2]);
    return intersection.length / union.size;
  }

  createAnalysisShape(
    relatedShapeIds: string[],
    analysisContent: string,
    position: { x: number; y: number }
  ) {
    const analysisId = createShapeId();
    this.editor.createShape({
      id: analysisId,
      type: "ai-text-result",
      x: position.x,
      y: position.y,
      props: {
        content: analysisContent,
        sourceType: "analysis",
        sourceShapeId: relatedShapeIds.join(","),
        createdDate: Date.now(),
      },
    });
    relatedShapeIds.forEach((sid) =>
      this.createConnection(sid, analysisId, "analyzes",)
    );
    return analysisId;
  }
}
