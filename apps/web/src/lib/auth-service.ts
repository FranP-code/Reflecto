import { account } from "./appwrite-client";
import { ID } from "appwrite";
import type { Models } from "appwrite";

export interface User extends Models.User<Models.Preferences> {}

export interface Session extends Models.Session {}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  // Signup a new user and automatically log them in
  async signUp(data: SignUpData): Promise<{ user: User; session: Session }> {
    try {
      // Create the user account
      const user = await account.create(
        ID.unique(),
        data.email,
        data.password,
        data.name,
      );

      // Automatically log in the user after signup
      const session = await account.createEmailPasswordSession(
        data.email,
        data.password,
      );

      return { user, session };
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  // Sign in an existing user
  async signIn(data: SignInData): Promise<Session> {
    try {
      const session = await account.createEmailPasswordSession(
        data.email,
        data.password,
      );
      return session;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  // Sign out the current user
  async signOut(): Promise<void> {
    try {
      await account.deleteSession("current");
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await account.get();
      return user;
    } catch (error) {
      // If user is not authenticated, return null
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      await account.get();
      return true;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
