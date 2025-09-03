import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { adminAccount, createSessionClient } from "../lib/appwrite";

const auth = new Hono();

const SESSION_COOKIE_NAME = "session";
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_IN_WEEK = 7;
const COOKIE_MAX_AGE =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_IN_WEEK; // 7 days
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;

// Sign up endpoint
auth.post("/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    // Create account using admin client
    const user = await adminAccount.create("unique()", email, password, name);

    // Create session using admin client
    const session = await adminAccount.createEmailPasswordSession(
      email,
      password
    );

    // Set session cookie for your domain
    setCookie(c, SESSION_COOKIE_NAME, session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return c.json({ user, session: { $id: session.$id } });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Sign up failed";
    return c.json({ error: errorMessage }, HTTP_BAD_REQUEST);
  }
});

// Sign in endpoint
auth.post("/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Create session using admin client
    const session = await adminAccount.createEmailPasswordSession(
      email,
      password
    );

    // Get user data
    const sessionClient = createSessionClient(session.secret);
    const user = await sessionClient.get();

    // Set session cookie for your domain
    setCookie(c, SESSION_COOKIE_NAME, session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return c.json({ user, session: { $id: session.$id } });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Sign in failed";
    return c.json({ error: errorMessage }, HTTP_BAD_REQUEST);
  }
});

// Sign out endpoint
auth.post("/signout", async (c) => {
  try {
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);

    if (sessionToken) {
      // Delete session from Appwrite
      const sessionClient = createSessionClient(sessionToken);
      await sessionClient.deleteSession("current");
    }

    // Clear session cookie
    setCookie(c, SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return c.json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Sign out failed";
    return c.json({ error: errorMessage }, HTTP_BAD_REQUEST);
  }
});

// Get current user endpoint
auth.get("/me", async (c) => {
  try {
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME);

    if (!sessionToken) {
      return c.json({ error: "No session" }, HTTP_UNAUTHORIZED);
    }

    const sessionClient = createSessionClient(sessionToken);
    const user = await sessionClient.get();

    return c.json({ user });
  } catch {
    return c.json({ error: "Invalid session" }, HTTP_UNAUTHORIZED);
  }
});

export { auth };
