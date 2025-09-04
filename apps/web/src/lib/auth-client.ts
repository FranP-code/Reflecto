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
  // Email verification helpers
  verify: {
    // Sends a verification email to the currently logged-in user
    sendEmail: async (redirectUrl: string) => {
      // Redirect URL must be registered in Appwrite console platform settings
      await account.createVerification(redirectUrl);
    },
    // Confirms verification using query params (?userId=...&secret=...)
    confirm: async ({ userId, secret }: { userId: string; secret: string }) => {
      await account.updateVerification(userId, secret);
    },
    // Quickly check current user's verification status
    status: async (): Promise<boolean> => {
      const me = (await account.get()) as Models.User<Models.Preferences>;
      return Boolean(me.emailVerification);
    },
  },
  // Password management helpers
  password: {
    // Change password for the currently logged-in user
    change: async ({
      oldPassword,
      newPassword,
    }: {
      oldPassword: string;
      newPassword: string;
    }) => {
      await account.updatePassword(newPassword, oldPassword);
    },
    // Password recovery (reset via email)
    recover: {
      // Start recovery flow: sends email with link to redirectUrl
      request: async ({
        email,
        redirectUrl,
      }: {
        email: string;
        redirectUrl: string;
      }) => {
        // Redirect URL must be registered in Appwrite console platform settings
        await account.createRecovery(email, redirectUrl);
      },
      // Complete recovery using the link's query params and new password
      confirm: async ({
        userId,
        secret,
        password,
      }: {
        userId: string;
        secret: string;
        password: string;
      }) => {
        // Some SDK versions require providing password twice
        await account.updateRecovery(userId, secret, password);
      },
    },
  },
};
