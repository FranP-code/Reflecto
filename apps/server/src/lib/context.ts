import type { Context as HonoContext } from "hono";
import { getCookie } from "hono/cookie";
import type { Models } from "node-appwrite";
import { createSessionClient } from "./appwrite";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  let user: Models.User<Models.Preferences> | null = null;

  try {
    // Get the session cookie from our server
    const sessionToken = getCookie(context, "session");

    if (sessionToken) {
      const account = createSessionClient(sessionToken);
      user = await account.get();
    }
  } catch {
    // Session is invalid or expired
    user = null;
  }

  return {
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
