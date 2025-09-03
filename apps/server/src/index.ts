import "dotenv/config";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
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

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
