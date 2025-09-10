import "dotenv/config";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { createContext } from "./lib/context";
import { logger } from "./lib/logger";
import { appRouter } from "./routers/index";

const app = new Hono();

if (process.env.NODE_ENV === "development") {
  try {
    const composePath = join(process.cwd(), "docker-compose.yml");
    execSync(`docker-compose -f ${composePath} up -d`, { stdio: "inherit" });
    logger.info("Waiting for services to start...");
    execSync("sleep 2");
    logger.info("Docker Compose started successfully");
  } catch (error) {
    logger.error("Failed to start Docker Compose:", error);
  }
}

app.use(honoLogger());
app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  })
);

// Utilities for OpenRouter
async function openRouterChat(
  apiKey: string,
  body: unknown,
  extra?: { referer?: string; title?: string }
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (extra?.referer) headers["HTTP-Referer"] = extra.referer;
  if (extra?.title) headers["X-Title"] = extra.title;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res;
}

function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return Buffer.from(binary, "binary").toString("base64");
}

// OCR via OpenRouter Sonoma Sky Alpha
app.post("/ai/ocr", async (c) => {
  const { OPENROUTER_API_KEY, OPENROUTER_SITE_URL, OPENROUTER_SITE_NAME, MOCK } =
    env<{
      OPENROUTER_API_KEY?: string;
      OPENROUTER_SITE_URL?: string;
      OPENROUTER_SITE_NAME?: string;
      MOCK?: string;
    }>(c);
  if (!OPENROUTER_API_KEY) {
    return c.json({ error: "Missing OPENROUTER_API_KEY" }, 500);
  }
  
  const blob = await c.req.blob();
  const contentType = c.req.header("content-type") || "image/png";
  const base64 = arrayBufferToBase64(await blob.arrayBuffer());
  const dataUrl = `data:${contentType};base64,${base64}`;

  const body = {
    model: "openrouter/sonoma-sky-alpha",
    messages: [
      {
        role: "system",
        content:
          "You are an OCR engine. Extract all text visible in the provided image. Respond with plain text only, preserving line breaks and reading order. Do not add commentary.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract text from this image and return only the text.",
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  };

  const res = await openRouterChat(OPENROUTER_API_KEY as string, body, {
    referer: OPENROUTER_SITE_URL,
    title: OPENROUTER_SITE_NAME,
  });
  if (!res.ok) {
    const err = await res.text();
    return c.json(
      { error: `OpenRouter error ${res.status}`, details: err },
      502
    );
  }
  const json = (await res.json()) as any;
  const text: string = json?.choices?.[0]?.message?.content ?? "";
  return c.json({ text });
});

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
