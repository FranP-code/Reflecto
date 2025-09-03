import type { Context as HonoContext } from "hono";
import { Account, Client, type Models } from "node-appwrite";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const headers = context.req.raw.headers;
  const authHeader =
    headers.get("authorization") ?? headers.get("Authorization");

  let user: Models.User<Models.Preferences> | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const jwt = authHeader.slice("Bearer ".length).trim();
    if (jwt) {
      try {
        const client = new Client()
          .setEndpoint(process.env.APPWRITE_ENDPOINT || "")
          .setProject(process.env.APPWRITE_PROJECT_ID || "")
          .setJWT(jwt);

        const account = new Account(client);
        user = await account.get();
      } catch {
        user = null;
      }
    }
  }

  return {
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
