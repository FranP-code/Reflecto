import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/verify-email")({
  validateSearch: z.object({
    userId: z.string().optional(),
    secret: z.string().optional(),
  }),
  component: VerifyEmailPage,
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: why not
function VerifyEmailPage() {
  const { userId, secret } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  // Avoid double-confirming on React strict mode mounts
  const hasAttemptedConfirm = useRef(false);

  // Build redirect URL for the verification email
  const redirectUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const url = new URL("/verify-email", window.location.origin);
    return url.toString();
  }, []);

  // Auto-confirm if userId and secret are present
  useEffect(() => {
    const doConfirm = async () => {
      if (!(userId && secret)) {
        return;
      }
      if (hasAttemptedConfirm.current) {
        return;
      }

      hasAttemptedConfirm.current = true;
      setIsConfirming(true);
      setConfirmError(null);
      try {
        await authClient.verify.confirm({ userId, secret });
        setConfirmed(true);
        toast.success("Email verified successfully");
        // Refresh the session so UI reflects verification state
        await queryClient.invalidateQueries({ queryKey: ["session", "me"] });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to verify email";
        setConfirmError(msg);
        setConfirmed(false);
        toast.error(msg);
      } finally {
        setIsConfirming(false);
      }
    };

    doConfirm();
  }, [secret, userId, queryClient]);

  // Check current verification status
  useEffect(() => {
    const check = async () => {
      if (!session) {
        setIsVerified(null);
        return;
      }
      setIsCheckingStatus(true);
      try {
        const ok = await authClient.verify.status();
        setIsVerified(ok);
      } catch {
        setIsVerified(null);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    check();
  }, [session]);

  const handleSendVerification = async () => {
    if (!session) {
      toast.info("Please sign in to send a verification email");
      navigate({ to: "/login" });
      return;
    }
    setIsSending(true);
    try {
      await authClient.verify.sendEmail(redirectUrl);
      toast.success("Verification email sent");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to send verification email";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  if (isSessionPending || isCheckingStatus || isConfirming) {
    return <Loader />;
  }

  // Render different states based on URL params and outcomes
  if (userId && secret) {
    if (confirmed) {
      return (
        <Wrapper>
          <Title>You're verified 🎉</Title>
          <p className="text-muted-foreground">
            Your email has been successfully verified.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild type="button">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild type="button" variant="secondary">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </Wrapper>
      );
    }

    if (confirmError) {
      return (
        <Wrapper>
          <Title>Verification failed</Title>
          <p className="text-muted-foreground">{confirmError}</p>
          <div className="mt-6 flex gap-3">
            <Button
              disabled={isSending}
              onClick={handleSendVerification}
              type="button"
            >
              {isSending ? "Sending..." : "Resend verification email"}
            </Button>
            <Button asChild type="button" variant="secondary">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </Wrapper>
      );
    }

    // Fallback while confirming
    return <Loader />;
  }

  // No confirmation params present: allow user to trigger verification
  if (!session) {
    return (
      <Wrapper>
        <Title>Verify your email</Title>
        <p className="text-muted-foreground">
          You need to be signed in to verify your email.
        </p>
        <div className="mt-6">
          <Button asChild type="button">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Title>Verify your email</Title>
      <p className="text-muted-foreground">
        {session.email ? `Signed in as ${session.email}` : "Signed in"}
      </p>
      {isVerified ? (
        <div className="mt-6">
          <p className="text-emerald-400">Your email is already verified.</p>
          <div className="mt-4">
            <Button asChild type="button">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-muted-foreground">
            Click the button below and check your inbox to complete
            verification.
          </p>
          <div className="mt-4 flex gap-3">
            <Button
              disabled={isSending}
              onClick={handleSendVerification}
              type="button"
            >
              {isSending ? "Sending..." : "Send verification email"}
            </Button>
            <Button asChild type="button" variant="secondary">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      )}
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-10 w-full max-w-lg p-6">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">{children}</div>
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-2 font-bold text-2xl">{children}</h1>;
}
