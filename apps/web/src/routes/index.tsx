import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AudioLines,
  Brain,
  Image as ImageIcon,
  Lock,
  Network,
  Search,
  Sparkles,
} from "lucide-react";
import type { ComponentType } from "react";
import DotGrid from "@/components/DotGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HealthBadge() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const status = healthCheck.isLoading
    ? "Checking"
    : healthCheck.data
      ? "Online"
      : "Offline";
  const color = healthCheck.isLoading
    ? "bg-yellow-500"
    : healthCheck.data
      ? "bg-emerald-500"
      : "bg-red-500";
  return (
    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-muted-foreground text-xs backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      API {status}
    </div>
  );
}

function PreviewCard() {
  return (
    <Card className="mx-auto w-full max-w-4xl overflow-hidden border-white/10 bg-white/5 backdrop-blur">
      <CardContent className="p-0">
        <div className="relative">
          {/* window chrome */}
          <div className="flex items-center gap-2 border-white/10 border-b px-4 py-2 text-muted-foreground text-xs">
            <div className="flex gap-1.5">
              <span className="block h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="block h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <div className="mx-auto">
              <span>reflecto.app</span>
            </div>
          </div>
          {/* fake content */}
          <div className="relative bg-grid">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="h-10 w-3/4 rounded-md bg-white/10" />
                <div className="h-4 w-5/6 rounded-md bg-white/10" />
                <div className="h-4 w-2/3 rounded-md bg-white/10" />
                <div className="h-4 w-4/5 rounded-md bg-white/10" />
                <div className="mt-4 h-9 w-40 rounded-md bg-white/10" />
              </div>
              <div className="grid grid-rows-3 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 h-3 w-24 rounded bg-white/10" />
                  <div className="h-16 rounded bg-white/10" />
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 h-3 w-28 rounded bg-white/10" />
                  <div className="h-16 rounded bg-white/10" />
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 h-3 w-20 rounded bg-white/10" />
                  <div className="h-16 rounded bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type Feature = {
  key: string;
  title: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  from: string; // e.g., from-purple-500/40
  to: string; // e.g., to-fuchsia-500/30
};

function FeatureTile({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div
      className={`group relative h-full rounded-2xl bg-gradient-to-br p-[1px] ${feature.from} ${feature.to}`}
    >
      <div className="relative h-full overflow-hidden rounded-2xl border bg-white/5 p-6 backdrop-blur transition-all duration-300 group-hover:border-white/40 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border bg-white/10 p-2 backdrop-blur">
            <Icon className="size-5" />
          </div>
          <div>
            <div className="font-medium text-base">{feature.title}</div>
            <div className="text-muted-foreground text-sm">{feature.desc}</div>
          </div>
        </div>
        <div
          className={`-right-10 -top-10 pointer-events-none absolute h-32 w-32 rounded-full blur-2xl ${feature.from.replace("from-", "bg-")}`}
        />
      </div>
    </div>
  );
}

function StepCard({ step }: { step: Step }) {
  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div className="group relative h-100 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-8 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04]">
        {/* Gradient accent */}
        <div className={`absolute inset-0 opacity-20 ${step.gradient}`} />

        {/* Content */}
        <div className="relative z-10 mt-8 flex h-full flex-col text-center">
          {/* Step number */}
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
            <span className="font-bold text-2xl lining-nums tabular-nums leading-none">
              {step.n}
            </span>
          </div>

          {/* Title */}
          <h3 className="mb-4 font-semibold text-2xl">{step.title}</h3>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
        </div>

        {/* Hover glow effect */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}

type Step = {
  n: number;
  title: string;
  desc: string;
  gradient: string;
};

function HowItWorks() {
  const STEPS: Step[] = [
    {
      n: 1,
      title: "Capture",
      desc: "Upload images, record audio, or paste text. Your thoughts, instantly digitized.",
      gradient: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
    },
    {
      n: 2,
      title: "Extract",
      desc: "Advanced OCR and speech-to-text automatically convert everything into searchable text.",
      gradient: "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
    },
    {
      n: 3,
      title: "Organize",
      desc: "AI intelligently tags and creates connections between your ideas in visual Spaces.",
      gradient: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
    },
    {
      n: 4,
      title: "Discover",
      desc: "Find anything instantly with powerful full-text search across your entire knowledge base.",
      gradient: "bg-gradient-to-br from-orange-500/20 to-yellow-500/20",
    },
  ];

  return (
    <div className="mx-auto mt-16 max-w-7xl">
      {/* Desktop layout */}
      <div className="hidden items-center justify-center gap-8 px-4 lg:flex">
        {STEPS.map((step) => (
          <StepCard key={step.n} step={step} />
        ))}
      </div>

      {/* Mobile layout */}
      <div className="space-y-8 lg:hidden">
        {STEPS.map((step) => (
          <StepCard key={step.n} step={step} />
        ))}
      </div>
    </div>
  );
}

const FEATURES: Feature[] = [
  {
    key: "ingestion",
    title: "Ingestion",
    desc: "Upload images and voice notes. OCR and speech‑to‑text run automatically.",
    icon: ImageIcon,
    from: "from-purple-500/40",
    to: "to-fuchsia-500/30",
  },
  {
    key: "ai",
    title: "AI Processing",
    desc: "We extract text and metadata into a structured store for fast retrieval.",
    icon: Brain,
    from: "from-indigo-500/40",
    to: "to-violet-500/30",
  },
  {
    key: "spaces",
    title: "Spaces Graph",
    desc: "Discover AI‑suggested relationships and navigate ideas visually.",
    icon: Network,
    from: "from-cyan-500/40",
    to: "to-emerald-500/30",
  },
  {
    key: "search",
    title: "Full‑text Search",
    desc: "Find anything with keywords across your entire second brain.",
    icon: Search,
    from: "from-emerald-500/40",
    to: "to-lime-500/30",
  },
  {
    key: "secure",
    title: "Secure & Private",
    desc: "Your data is yours—authentication and storage are handled securely.",
    icon: Lock,
    from: "from-rose-500/40",
    to: "to-pink-500/30",
  },
  {
    key: "voice",
    title: "Voice‑first",
    desc: "Capture thoughts hands‑free and let Reflecto do the rest.",
    icon: AudioLines,
    from: "from-amber-500/40",
    to: "to-orange-500/30",
  },
];

function HomeComponent() {
  return (
    <>
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "fixed",
        }}
      >
        <DotGrid
          activeColor="#525151"
          baseColor="#281E37"
          dotSize={5}
          gap={15}
          proximity={120}
          resistance={750}
          returnDuration={1.5}
          shockRadius={250}
          shockStrength={5}
        />
      </div>
      <div className="relative">
        {/* Hero */}
        <section className="container mx-auto max-w-7xl px-4 pt-14 pb-24 sm:pt-20 sm:pb-32">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <HealthBadge />
            <h1 className="mt-6 animate-shine bg-[linear-gradient(120deg,white,white_40%,rgba(255,255,255,0.7)_60%,rgba(255,255,255,0.3))] bg-clip-text font-semibold text-5xl text-transparent leading-tight [background-size:200%_100%] sm:text-6xl md:text-7xl lg:text-8xl">
              Reflecto
            </h1>
            <p className="mt-5 text-balance text-lg text-muted-foreground sm:text-xl">
              Your AI‑powered second brain. Capture voice, images, and
              text—Reflecto turns it into a searchable, connected knowledge
              base.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/login">
                  <Sparkles className="mr-2 size-4" /> Get started
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/dashboard">View dashboard</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-3 text-muted-foreground text-xs">
              <img
                alt="Reflecto"
                className="h-5 w-5 rounded-sm"
                height="20"
                src="/logo.png"
                width="20"
              />
              <span>Private by default • Powered by lightweight AI</span>
            </div>
          </div>
          {/* Showcase preview */}
          <div className="mt-12 sm:mt-16">
            <PreviewCard />
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto max-w-7xl px-4 py-16 sm:py-24">
          {/* quick stats */}
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 pb-8 text-center sm:grid-cols-4">
            {[
              { n: "2x", l: "Faster capture" },
              { n: "100%", l: "Private by default" },
              { n: "< 1s", l: "Search latency" },
              { n: "∞", l: "Ideas connected" },
            ].map((s) => (
              <div className="rounded-lg border bg-white/5 p-4" key={s.l}>
                <div className="font-semibold text-3xl sm:text-4xl">{s.n}</div>
                <div className="text-muted-foreground text-xs">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {FEATURES.map((f) => (
              <FeatureTile feature={f} key={f.key} />
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto max-w-7xl px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-muted-foreground text-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>How it works</span>
            </div>
            <h2 className="text-balance font-bold text-4xl sm:text-5xl lg:text-6xl">
              From chaos to clarity
            </h2>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Transform scattered thoughts into organized knowledge in four
              seamless steps.
            </p>
          </div>
          <HowItWorks />
        </section>

        {/* Call to action */}
        <section className="container mx-auto max-w-6xl px-4 pt-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.08] p-8 sm:p-10">
            {/* Decorative gradient blobs behind content to increase contrast */}
            <div className="-left-8 -top-8 pointer-events-none absolute h-56 w-56 rounded-full bg-gradient-to-br from-purple-500/30 to-fuchsia-500/20 opacity-60 blur-3xl" />
            <div className="-right-12 -bottom-8 pointer-events-none absolute h-72 w-72 rounded-full bg-gradient-to-br from-cyan-400/25 to-emerald-400/15 opacity-50 blur-3xl" />
            {/* subtle grid overlay similar to preview */}
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-20 mix-blend-overlay" />

            <div className="relative z-10 flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div>
                <h3 className="text-balance font-semibold text-2xl sm:text-3xl">
                  Build your second brain
                </h3>
                <p className="text-muted-foreground">
                  Start free. Your knowledge stays private.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild size="lg">
                  <Link to="/login">Create account</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/dashboard">Go to app</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto max-w-7xl px-4 pt-4 pb-10 text-muted-foreground text-xs">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <img
                alt="Reflecto"
                className="h-4 w-4 rounded-sm"
                height="16"
                src="/logo.png"
                width="16"
              />
              <span>Reflecto</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/">Home</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
