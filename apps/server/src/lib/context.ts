import type { Context as HonoContext } from "hono";
import { Account, Client } from "node-appwrite";

// Hoisted regex for performance and linting
const BEARER_REGEX = /^Bearer\s+(.+)$/i;

// Minimal user shape to avoid leaking node-appwrite model types
export type AuthUser = {
  $id: string;
  name?: string | null;
  email?: string | null;
} | null;

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;

  if (!(endpoint && projectId)) {
    // Appwrite not configured; treat as unauthenticated
    return { user: null as AuthUser };
  }

  // Initialize client per request
  const client = new Client().setEndpoint(endpoint).setProject(projectId);

  // Prefer JWT from Authorization header if provided
  const authHeader = context.req.header("Authorization");
  const bearer = authHeader?.match(BEARER_REGEX)?.[1];

  if (bearer) {
    client.setJWT(bearer);
  } else {
    // Fallback: Appwrite session cookie from browser
    // Cookie name format: a_session_<PROJECT_ID>
    const cookieHeader =
      context.req.header("Cookie") || context.req.header("cookie");
    if (cookieHeader) {
      const cookieName = `a_session_${projectId}`;
      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => {
          const idx = c.indexOf("=");
          return idx === -1
            ? [c, ""]
            : [c.substring(0, idx), decodeURIComponent(c.substring(idx + 1))];
        })
      );
      const session = cookies[cookieName];
      if (session) {
        client.setSession(session);
      }
    }
  }

  const account = new Account(client);

  try {
    const user = (await account.get()) as unknown as {
      $id: string;
      name?: string | null;
      email?: string | null;
    };
    const minimal: AuthUser = {
      $id: user.$id,
      name: user.name ?? null,
      email: user.email ?? null,
    };
    return { user: minimal };
  } catch {
    return { user: null as AuthUser };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;
