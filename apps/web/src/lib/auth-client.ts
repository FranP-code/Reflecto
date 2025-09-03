import { useQuery } from "@tanstack/react-query";
import type { Models } from "appwrite";
import { Account, Client, ID } from "appwrite";

// Initialize Appwrite web client
export const appwriteClient = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(appwriteClient);

// Simple session hook using React Query
export function useSession() {
  return useQuery({
    queryKey: ["session", "me"],
    queryFn: async () => {
      try {
        const me = await account.get();
        return me as Models.User<Models.Preferences>;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
  });
}

// Sign up, sign in, sign out helpers
export const authClient = {
  useSession,
  signUp: {
    email: async ({
      email,
      password,
      name,
    }: {
      email: string;
      password: string;
      name?: string;
    }) => {
      await account.create(ID.unique(), email, password, name);
      // Immediately create session after sign up
      await account.createEmailPasswordSession(email, password);
    },
  },
  signIn: {
    email: async ({ email, password }: { email: string; password: string }) => {
      await account.createEmailPasswordSession(email, password);
    },
  },
  signOut: async () => {
    try {
      await account.deleteSessions();
    } catch {
      // ignore
    }
  },
  // Get a short-lived JWT for server-side calls (15 min)
  getJWT: async (): Promise<string | null> => {
    try {
      const jwt = await account.createJWT();
      return jwt.jwt ?? null;
    } catch {
      return null;
    }
  },
};
