import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import AuthLayout from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { account } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    let me = null;
    try {
      me = await account.get();
    } catch {
      // ignore
    }
    console.log(me)
    if (me) {
      const isVerified = Boolean(me.emailVerification);
      if (isVerified) {
        throw redirect({ to: "/dashboard" });
      }
      throw redirect({ to: "/verify-email" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  const title = showSignIn ? "Welcome back" : "Create your account";
  const subtitle = showSignIn
    ? "Sign in to access your dashboard and keep creating."
    : "Join Reflecto to capture ideas and collaborate seamlessly.";

  return (
    <AuthLayout
      footer={
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild className="px-0" variant="link">
              <Link search={{ mode: "recover" }} to="/password">
                Forgot password?
              </Link>
            </Button>
            <Button asChild className="px-0" variant="link">
              <Link to="/verify-email">Verify your email</Link>
            </Button>
          </div>

          <div>
            {showSignIn ? (
              <Button
                className="px-0 text-primary"
                onClick={() => setShowSignIn(false)}
                variant="link"
              >
                Need an account? Sign Up
              </Button>
            ) : (
              <Button
                className="px-0 text-primary"
                onClick={() => setShowSignIn(true)}
                variant="link"
              >
                Already have an account? Sign In
              </Button>
            )}
          </div>
        </div>
      }
      subtitle={subtitle}
      title={title}
    >
      {showSignIn ? (
        <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
      ) : (
        <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
      )}
    </AuthLayout>
  );
}
