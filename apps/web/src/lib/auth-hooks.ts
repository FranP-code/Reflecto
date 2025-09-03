import { useCallback, useEffect, useState } from "react";

type User = {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  prefs: Record<string, unknown>;
};

type UseSessionReturn = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: "include", // Important: include cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user as User);
      } else {
        setUser(null);
      }
    } catch {
      // User is not logged in or network error
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return { user, loading, error };
}

export function useAuth() {
  const { user, loading, error } = useSession();

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        // Trigger a session refresh
        window.location.reload();
        return { user: data.user, error: null };
      }

      return { user: null, error: data.error };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign up failed";
      return { user: null, error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Trigger a session refresh
        window.location.reload();
        return { user: data.user, error: null };
      }

      return { user: null, error: data.error };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      return { user: null, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Trigger a session refresh
        window.location.reload();
        return { error: null };
      }

      const data = await response.json();
      return { error: data.error };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign out failed";
      return { error: errorMessage };
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };
}
