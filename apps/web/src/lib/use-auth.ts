import { useState, useEffect, useCallback } from "react";
import { authService } from "./auth-service";
import type { Models } from "appwrite";

interface User extends Models.User<Models.Preferences> {}

interface UseAuthReturn {
  user: User | null;
  isPending: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    setIsPending(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    user,
    isPending,
    isAuthenticated,
  };
}
