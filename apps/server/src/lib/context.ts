import type { Context as HonoContext } from "hono";
import { getCookie } from "hono/cookie";
import { Client, Account } from "appwrite";
import { AppwriteException } from "appwrite";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  // Check if required environment variables are set
  const endpoint =
    process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const projectID = process.env.APPWRITE_PROJECT_ID || "";

  console.log("Appwrite Endpoint:", endpoint);
  console.log("Project ID:", projectID);

  // If no project ID, we can't validate sessions
  if (!projectID) {
    console.log("No project ID found, returning null user");
    return {
      user: null,
    };
  }

  // Log all cookies for debugging
  const allCookies = context.req.raw.headers.get("cookie");
  console.log("All cookies:", allCookies);

  // Extract Appwrite session cookie using Hono's cookie helper
  const cookieName = `a_session_${projectID}`;
  const sessionCookie = getCookie(context, cookieName);

  console.log("Looking for cookie:", cookieName);
  console.log("Session Cookie Value:", sessionCookie);

  // If no session cookie, return null user
  if (!sessionCookie) {
    console.log("No session cookie found, returning null user");
    return {
      user: null,
    };
  }

  try {
    // Initialize Appwrite client for server-side validation
    const client = new Client().setEndpoint(endpoint).setProject(projectID);

    // Set the session for this client using the cookie value (session secret)
    console.log("Setting session on client");
    client.setSession(sessionCookie);

    const account = new Account(client);

    // Try to get the current user from the session
    console.log("Attempting to get user from session");
    const appwriteUser = await account.get();
    console.log("Appwrite User:", appwriteUser);

    // Create a simplified user object with only the properties we need
    const user = {
      $id: appwriteUser.$id,
      name: appwriteUser.name,
      email: appwriteUser.email,
    };

    console.log("Successfully authenticated user:", user);
    return {
      user,
    };
  } catch (error) {
    console.log("Error during authentication:", error);
    // Handle Appwrite exceptions specifically
    if (error instanceof AppwriteException) {
      console.log("Appwrite Exception:", {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response,
      });
      // For any Appwrite error (including 401), return null user
      return {
        user: null,
      };
    }

    // For any other error, also return null user
    console.log("Unknown error:", error);
    return {
      user: null,
    };
  }
}

export interface Context {
  user: { $id: string; name: string; email: string } | null;
}
