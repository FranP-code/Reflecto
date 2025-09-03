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
import { Button } from "@/components/ui/button";
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

// Preview removed for a cleaner, non-card hero

type Feature = {
  key: string;
  title: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
};

function FeatureRow({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="font-medium text-base">{feature.title}</div>
        <div className="text-muted-foreground text-sm">{feature.desc}</div>
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
  },
  {
    key: "ai",
    title: "AI Processing",
    desc: "We extract text and metadata into a structured store for fast retrieval.",
    icon: Brain,
  },
  {
    key: "spaces",
    title: "Spaces Graph",
    desc: "Discover AI‑suggested relationships and navigate ideas visually.",
    icon: Network,
  },
  {
    key: "search",
    title: "Full‑text Search",
    desc: "Find anything with keywords across your entire second brain.",
    icon: Search,
  },
  {
    key: "secure",
    title: "Secure & Private",
    desc: "Your data is yours—authentication and storage are handled securely.",
    icon: Lock,
  },
  {
    key: "voice",
    title: "Voice‑first",
    desc: "Capture thoughts hands‑free and let Reflecto do the rest.",
    icon: AudioLines,
  },
];

function HomeComponent() {
  return (
    <div className="relative">
      {/* Background stripped to minimal */}

      {/* Hero */}
      <section className="container mx-auto max-w-7xl px-4 pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <HealthBadge />
          <h1 className="mt-6 font-semibold text-5xl leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Reflecto
          </h1>
          <p className="mt-5 text-balance text-lg text-muted-foreground sm:text-xl">
            Your AI‑powered second brain. Capture voice, images, and
            text—Reflecto turns it into a searchable, connected knowledge base.
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
      </section>

      {/* Features */}
      <section className="container mx-auto max-w-7xl px-4 py-16 sm:py-24">
        {/* quick stats */}
        <div className="mx-auto max-w-4xl pb-10">
          <div className="grid grid-cols-2 items-center text-center text-sm sm:grid-cols-4">
            {[
              { n: "2x", l: "Faster capture" },
              { n: "100%", l: "Private by default" },
              { n: "< 1s", l: "Search latency" },
              { n: "∞", l: "Ideas connected" },
            ].map((s, i) => (
              <div
                className={`px-3 py-3 ${i % 2 === 1 ? "border-white/10 border-l" : ""} sm:last:rounded-r-lg sm:first:rounded-l-lg`}
                key={s.l}
              >
                <div className="font-semibold text-3xl sm:text-4xl">{s.n}</div>
                <div className="text-muted-foreground text-xs">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* features list */}
        <div className="mx-auto max-w-4xl divide-y divide-white/10">
          {FEATURES.map((f) => (
            <FeatureRow feature={f} key={f.key} />
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
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 sm:p-10">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
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
  );
}
