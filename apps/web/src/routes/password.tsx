import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const MIN_PASSWORD_LENGTH = 8;

const SearchSchema = z.object({
  mode: z.enum(["change", "recover", "confirm"]).optional(),
  userId: z.string().optional(),
  secret: z.string().optional(),
});

export const Route = createFileRoute("/password")({
  validateSearch: SearchSchema,
  component: PasswordPage,
});

function PasswordPage() {
  const navigate = useNavigate();
  const query = useSearch({ from: "/password" });
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const mode = useMemo(() => {
    if (query.mode === "confirm" || (query.userId && query.secret)) {
      return "confirm" as const;
    }
    if (query.mode === "recover") {
      return "recover" as const;
    }
    return "change" as const;
  }, [query.mode, query.userId, query.secret]);

  if (isSessionPending) {
    return <Loader />;
  }

  // If in confirm mode but missing params, guide user to recover
  if (mode === "confirm" && !(query.userId && query.secret)) {
    return (
      <Wrapper>
        <Title>Password reset</Title>
        <p className="text-muted-foreground">
          Your reset link appears to be missing details. Start a new password
          recovery request.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild type="button">
            <Link search={{ mode: "recover" }} to="/password">
              Start recovery
            </Link>
          </Button>
          <Button asChild type="button" variant="secondary">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </Wrapper>
    );
  }

  if (mode === "confirm" && query.userId && query.secret) {
    return (
      <Wrapper>
        <Title>Set a new password</Title>
        <ResetConfirmForm
          onSuccess={() => {
            toast.success("Password reset successful. Please sign in.");
            navigate({ to: "/login" });
          }}
          secret={query.secret}
          userId={query.userId}
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <HeaderTabs active={mode} />
      {mode === "recover" ? (
        <>
          <Title>Forgot password</Title>
          <p className="text-muted-foreground">
            Enter your email to receive a password reset link.
          </p>
          <div className="mt-6">
            <RecoveryRequestForm />
          </div>
        </>
      ) : (
        <>
          <Title>Change password</Title>
          {session ? (
            <>
              <p className="text-muted-foreground">
                Update your password. You will stay signed in.
              </p>
              <div className="mt-6">
                <ChangePasswordForm />
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                You need to sign in to change your password. If you forgot your
                password, use recovery instead.
              </p>
              <div className="mt-6 flex gap-3">
                <Button asChild type="button">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild type="button" variant="secondary">
                  <Link search={{ mode: "recover" }} to="/password">
                    Forgot password
                  </Link>
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </Wrapper>
  );
}

function HeaderTabs({ active }: { active: "change" | "recover" | "confirm" }) {
  if (active === "confirm") {
    return null;
  }
  return (
    <div className="mb-6 inline-flex rounded-lg border bg-card p-1">
      <TabLink
        active={active === "change"}
        label="Change password"
        search={{ mode: "change" as const }}
        to="/password"
      />
      <TabLink
        active={active === "recover"}
        label="Recover password"
        search={{ mode: "recover" as const }}
        to="/password"
      />
    </div>
  );
}

function TabLink<TSearch extends Record<string, unknown>>({
  to,
  search,
  active,
  label,
}: {
  to: string;
  search: TSearch;
  active: boolean;
  label: string;
}) {
  return (
    <Button asChild type="button" variant={active ? "default" : "ghost"}>
      <Link search={search} to={to}>
        {label}
      </Link>
    </Button>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const schema = z
    .object({
      currentPassword: z
        .string()
        .min(
          MIN_PASSWORD_LENGTH,
          `Must be at least ${MIN_PASSWORD_LENGTH} characters`
        ),
      newPassword: z
        .string()
        .min(
          MIN_PASSWORD_LENGTH,
          `Must be at least ${MIN_PASSWORD_LENGTH} characters`
        ),
      confirm: z.string(),
    })
    .refine((v) => v.newPassword === v.confirm, {
      message: "Passwords do not match",
      path: ["confirm"],
    })
    .refine((v) => v.newPassword !== v.currentPassword, {
      message: "New password must be different from current password",
      path: ["newPassword"],
    });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: why not
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ currentPassword, newPassword, confirm });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await authClient.password.change({
        oldPassword: currentPassword,
        newPassword,
      });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      // Refresh session cache
      await queryClient.invalidateQueries({ queryKey: ["session", "me"] });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to change password";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          onChange={(e) => setCurrentPassword(e.target.value)}
          type="password"
          value={currentPassword}
        />
        {errors.currentPassword ? (
          <p className="text-red-500">{errors.currentPassword}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          value={newPassword}
        />
        {errors.newPassword ? (
          <p className="text-red-500">{errors.newPassword}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          name="confirm"
          onChange={(e) => setConfirm(e.target.value)}
          type="password"
          value={confirm}
        />
        {errors.confirm ? (
          <p className="text-red-500">{errors.confirm}</p>
        ) : null}
      </div>

      <div className="pt-2">
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Updating..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}

function RecoveryRequestForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = z.object({
    email: z.string().email("Enter a valid email"),
  });

  const redirectUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    const url = new URL("/password", window.location.origin);
    url.searchParams.set("mode", "confirm");
    return url.toString();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid email";
      setError(msg);
      return;
    }
    setSubmitting(true);
    try {
      await authClient.password.recover.request({
        email,
        redirectUrl,
      });
      toast.success("If an account exists, a recovery link has been sent");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to start recovery";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          value={email}
        />
        {error ? <p className="text-red-500">{error}</p> : null}
      </div>
      <div className="pt-2">
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Sending..." : "Send recovery email"}
        </Button>
      </div>
    </form>
  );
}

function ResetConfirmForm({
  userId,
  secret,
  onSuccess,
}: {
  userId: string;
  secret: string;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schema = z
    .object({
      password: z
        .string()
        .min(
          MIN_PASSWORD_LENGTH,
          `Must be at least ${MIN_PASSWORD_LENGTH} characters`
        ),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, {
      message: "Passwords do not match",
      path: ["confirm"],
    });

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: why not
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await authClient.password.recover.confirm({
        userId,
        secret,
        password,
      });
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to reset password";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          autoComplete="new-password"
          id="password"
          name="password"
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          value={password}
        />
        {errors.password ? (
          <p className="text-red-500">{errors.password}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmReset">Confirm new password</Label>
        <Input
          autoComplete="new-password"
          id="confirmReset"
          name="confirmReset"
          onChange={(e) => setConfirm(e.target.value)}
          type="password"
          value={confirm}
        />
        {errors.confirm ? (
          <p className="text-red-500">{errors.confirm}</p>
        ) : null}
      </div>

      <div className="pt-2">
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Resetting..." : "Reset password"}
        </Button>
      </div>
    </form>
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
