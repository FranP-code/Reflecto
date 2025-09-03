import { Account, Client, ID, type Models } from "appwrite";
import { useEffect, useState } from "react";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string;

const client = new Client().setEndpoint(endpoint).setProject(projectId);
const account = new Account(client);

export function useUser() {
  const [isPending, setIsPending] = useState(true);
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    account
      .get()
      .then((u: Models.User<Models.Preferences>) => {
        if (!mounted) {
          return;
        }
        setUser(u);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setUser(null);
      })
      .finally(() => {
        if (!mounted) {
          return;
        }
        setIsPending(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { data: user, isPending };
}

export const authClient = {
  // Email+password signup
  async signUpEmail({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name?: string;
  }) {
    const user = await account.create(ID.unique(), email, password, name);
    // Immediately create a session after signup for convenience
    await account.createEmailPasswordSession(email, password);
    return user;
  },
  // Login
  signInEmail({ email, password }: { email: string; password: string }) {
    return account.createEmailPasswordSession(email, password);
  },
  // Logout current session
  async signOut() {
    try {
      return await account.deleteSession("current");
    } catch {
      return null;
    }
  },
  // Get current user
  getUser() {
    return account.get();
  },
  // Useful for backend requests with JWT-based auth
  async getJWT() {
    // Appwrite web SDK exposes createJWT via Account
    // Note: JWT expires quickly (~15 min)
    const { jwt } = await account.createJWT();
    return jwt;
  },
};
