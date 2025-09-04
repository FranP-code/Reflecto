import { Link } from "@tanstack/react-router";

export default function Footer() {
  return (
    <footer className="relative mt-8 mb-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div
              className={[
                "flex",
                "items-center",
                "gap-2",
                "text-xs",
                "text-muted-foreground",
              ].join(" ")}
            >
              <span
                aria-hidden
                className="inline-block h-4 w-4 rounded bg-gradient-to-br from-purple-500 to-fuchsia-500"
              />
              <span className="font-medium">Reflecto</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden text-muted-foreground sm:inline">
                Private by default
              </span>
            </div>

            <nav
              className={[
                "flex",
                "items-center",
                "gap-4",
                "text-xs",
                "text-muted-foreground",
              ].join(" ")}
            >
              <Link to="/">Home</Link>
              <Link to="/dashboard">Dashboard</Link>
            </nav>

            <div className={["text-xs", "text-muted-foreground"].join(" ")}>
              <span className="lining-nums tabular-nums">
                © {new Date().getFullYear()}
              </span>{" "}
              Reflecto
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
