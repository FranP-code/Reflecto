import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
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

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
