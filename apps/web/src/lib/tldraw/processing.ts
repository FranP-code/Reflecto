import { createShapeId } from "tldraw";
import { getApiBaseUrl } from "@/lib/utils";
import { uploadImageToStorage } from "@/lib/appwrite-db";
import { KnowledgeGraphManager } from "./knowledge-graph";
import { createAITextResult } from "./ai-shapes";

const API_BASE = getApiBaseUrl();

async function postBinary(url: string, file: File): Promise<{ text: string }> {
  const res = await fetch(url, {
    method: "POST",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<{ text: string }>;
}

async function postJson<TReq extends object, TRes>(url: string, body: TReq): Promise<TRes> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<TRes>;
}

export async function generateText(prompt: string, temperature: number = 0.7): Promise<string> {
  const { text } = await postJson<{ prompt: string; temperature: number }, { text: string }>(
    `${API_BASE}/ai/generate`,
    { prompt, temperature }
  );
  return text;
}

export async function processPromptGeneration(
  editor: any,
  promptShapeId: string
): Promise<void> {
  const shape = editor.getShape(promptShapeId);
  if (!shape || shape.type !== "ai-prompt") return;
  const prompt: string = shape.props.prompt ?? "";
  const temperature: number = Number(shape.props.temperature ?? 0.7) || 0.7;
  editor.updateShape({ id: promptShapeId, type: "ai-prompt", props: { status: "processing" } });
  try {
    const { text } = await postJson<{ prompt: string; temperature: number }, { text: string }>(
      `${API_BASE}/ai/generate`,
      { prompt, temperature }
    );

    const pShape = editor.getShape(promptShapeId);
    const pW = Math.max(1, pShape?.props?.w ?? 320);
    const gap = Math.min(80, Math.max(24, Math.floor(pW * 0.12)));
    const textShapeId = createAITextResult(editor, {
      fromShapeId: promptShapeId,
      sourceType: "prompt",
      content: text,
      x: pShape.x + pW + gap,
      y: pShape.y,
    });

    const kgManager = new KnowledgeGraphManager(editor);
    kgManager.createConnection(promptShapeId, textShapeId, "generates");
    await kgManager.analyzeConnections(textShapeId);

    editor.updateShape({ id: promptShapeId, type: "ai-prompt", props: { status: "completed" } });
  } catch (e) {
    editor.updateShape({ id: promptShapeId, type: "ai-prompt", props: { status: "error" } });
  }
}

export async function processImageWithOCR(
  editor: any,
  shapeId: string,
  imageFile: File
): Promise<void> {
  editor.updateShape({
    id: shapeId,
    type: "ai-image",
    props: { processingStatus: "processing" },
  });
  try {
    const { text } = await postBinary(`${API_BASE}/ai/ocr`, imageFile);

    editor.updateShape({
      id: shapeId,
      type: "ai-image",
      props: { extractedText: text, processingStatus: "completed" },
    });

  const imageShape = editor.getShape(shapeId);
    // Place to the right of the image with a proportional gap
    const imgW = Math.max(1, imageShape?.props?.w ?? 300);
    const gap = Math.min(80, Math.max(24, Math.floor(imgW * 0.12)));
    const textShapeId = createAITextResult(editor, {
      fromShapeId: shapeId,
      sourceType: "image",
      content: text,
      x: imageShape.x + imgW + gap,
      y: imageShape.y,
    });

    const kgManager = new KnowledgeGraphManager(editor);
  kgManager.createConnection(shapeId, textShapeId, "extracts_text",);
  await kgManager.analyzeConnections(textShapeId);
  } catch (e) {
    editor.updateShape({
      id: shapeId,
      type: "ai-image",
      props: { processingStatus: "error" },
    });
  }
}

export function setupFileDropHandler(editor: any) {
  const container = editor.getContainer();
  const handleDragOver = (e: DragEvent) => e.preventDefault();

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []);
    const dropPoint = editor.screenToPage({
      x: event.clientX,
      y: event.clientY,
    });

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        await createImageShapeFromFile(editor, file, dropPoint);
      }
    }
  };

  container.addEventListener("dragover", handleDragOver);
  container.addEventListener("drop", handleDrop);

  return () => {
    container.removeEventListener("dragover", handleDragOver);
    container.removeEventListener("drop", handleDrop);
  };
}

export async function createImageShapeFromFile(
  editor: any,
  file: File,
  position: any
) {
  // First upload to Appwrite Storage for persistence
  let persistentUrl = "";
  let storageFileId = "";
  try {
    const { fileUrl, fileId } = await uploadImageToStorage(file);
    persistentUrl = fileUrl;
    storageFileId = fileId;
  } catch (e) {
    // Fallback to blob URL if upload fails, but mark as error later
    persistentUrl = URL.createObjectURL(file);
  }
  // Load to get natural dimensions
  const dims = await new Promise<{ w: number; h: number }>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 640;
      const maxH = 480;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const target = 0.5; // scale to 50% of natural size
      const scale = Math.min(target, maxW / w, maxH / h);
      resolve({
        w: Math.max(180, Math.floor(w * scale)),
        h: Math.max(120, Math.floor(h * scale)),
      });
    };
    img.onerror = () => resolve({ w: 300, h: 200 });
    img.src = persistentUrl;
  });
  const shapeId = createShapeId();
  editor.createShape({
    id: shapeId,
    type: "ai-image",
    x: position.x,
    y: position.y,
    props: {
      imageUrl: persistentUrl,
      filename: file.name,
      uploadDate: Date.now(),
      processingStatus: storageFileId ? "idle" : "error",
      extractedText: "",
      w: dims.w,
      h: dims.h,
    },
  });
  await processImageWithOCR(editor, shapeId, file);
}

export async function createPromptShape(
  editor: any,
  position: { x: number; y: number }
) {
  const shapeId = createShapeId();
  editor.createShape({
    id: shapeId,
    type: "ai-prompt",
    x: position.x,
    y: position.y,
    props: {
      prompt: "",
      status: "idle",
      createdDate: Date.now(),
      w: 320,
      h: 180,
      temperature: 0.7,
    },
  });
  return shapeId;
}

export function registerPromptGenerator(editor: any) {
  (window as any).__aiGenerate = async (shapeId: string) => {
    try {
      await processPromptGeneration(editor, shapeId);
    } catch {
      // status updates happen inside
    }
  };
}
