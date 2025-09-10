import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient, account } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { ALLOWED_MODELS } from "../../../server/src/lib/ai-models";


export const Route = createFileRoute("/settings")({
    component: SettingsPage,
});

function SettingsPage() {
    const { data: session, isPending } = authClient.useSession();
    const navigate = Route.useNavigate();
    const queryClient = useQueryClient();

    const [model, setModel] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    // Load allowed models from server
    const allowed = useQuery(trpc.allowedModels.queryOptions());

    // Derive account info safely
    const accountName = session?.name ?? "";
    const accountEmail = session?.email ?? "";
    const emailVerified = Boolean(session?.emailVerification);

    // Initial load of preference from Appwrite prefs or localStorage fallback
    useEffect(() => {
        if (!isPending && !session) {
            navigate({ to: "/login" });
            return;
        }

        const fromStorage = () => {
            try {
                return localStorage.getItem("aiModel") || "";
            } catch {
                return "";
            }
        };

        async function loadPrefs() {
            try {
                if (!session) return;
                // Appwrite stores arbitrary preferences per user
                const me = await account.get();
                const prefs = (me as any).prefs as Record<string, unknown> | undefined;
                const existing = (prefs?.["aiModel"] as string) || fromStorage();
                const defaultModel = allowed.data?.defaultModel || ALLOWED_MODELS[0];
                setModel(existing || defaultModel);
            } catch {
                const defaultModel = allowed.data?.defaultModel || ALLOWED_MODELS[0];
                setModel(fromStorage() || defaultModel);
            }
        }

        loadPrefs();
    }, [session, isPending, navigate, allowed.data?.defaultModel]);

    const models = useMemo(() => {
        const list = allowed.data?.models ?? ALLOWED_MODELS;
        // Shape to id+name (use id as label by default)
        return list.map((id) => ({ id, name: id }));
    }, [allowed.data?.models]);

    async function handleSave() {
        if (!session) return;
        setIsSaving(true);
        try {
            // Persist to Appwrite preferences
            await account.updatePrefs({ aiModel: model } as any);
            // Persist locally for quick header injection
            try {
                localStorage.setItem("aiModel", model);
            } catch {
                // ignore
            }
            // Invalidate session cache to refresh prefs quickly if needed
            queryClient.invalidateQueries({ queryKey: ["session", "me"] });
            toast.success("Preferences saved");
        } catch (e: any) {
            toast.error(e?.message ?? "Failed to save preferences");
        } finally {
            setIsSaving(false);
        }
    }

    if (isPending) {
        return <div className="container mx-auto max-w-5xl px-4 py-10">Loading...</div>;
    }

    return (
        <div className="container mx-auto max-w-5xl px-4 py-10">
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border/60 bg-card/60 backdrop-blur">
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                        <CardDescription>Your account information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Name</span>
                            <span className="font-medium">{accountName || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Email</span>
                            <span className="font-medium">{accountEmail || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Email Verified</span>
                            <span className={"font-medium " + (emailVerified ? "text-emerald-400" : "text-amber-400")}>{emailVerified ? "Yes" : "No"}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/60 backdrop-blur">
                    <CardHeader>
                        <CardTitle>AI Model</CardTitle>
                        <CardDescription>Select the model for AI operations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="model">Model</Label>
                                <div className="relative">
                                    <select
                                        id="model"
                                        className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm outline-none ring-0 transition focus:border-primary"
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                    >
                                        {models.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground">▾</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                                <Button disabled={isSaving || !model} onClick={handleSave}>
                                    {isSaving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
