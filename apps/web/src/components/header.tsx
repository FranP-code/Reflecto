import { Link } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <header className="sticky top-0 z-50">
      {/* Subtle gradient ribbon behind the header for depth */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-3">
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur supports-[backdrop-filter]:bg-white/5">
          <div className="relative flex items-center justify-between px-4 py-2">
            {/* Logo + primary nav */}
            <div className="flex items-center gap-4">
              <Link className="inline-flex items-center gap-2" to="/">
                <span
                  aria-hidden
                  className="inline-block h-6 w-6 rounded bg-gradient-to-br from-purple-500 to-fuchsia-500"
                />
                <span className="font-semibold tracking-tight">Reflecto</span>
              </Link>

              <nav className="hidden items-center gap-2 sm:flex">
                {links.map(({ to, label }) => (
                  <Link
                    activeProps={{ className: "text-white" }}
                    className={[
                      "rounded-lg",
                      "px-3",
                      "py-1.5",
                      "text-sm",
                      "text-muted-foreground",
                      "transition-colors",
                      "hover:text-white",
                    ].join(" ")}
                    key={to}
                    to={to}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <ModeToggle />
              <UserMenu />
            </div>

            {/* Mobile nav (compact) */}
            <nav className="flex items-center gap-2 sm:hidden">
              {links.map(({ to, label }) => (
                <Link
                  className={[
                    "rounded-lg",
                    "px-2",
                    "py-1",
                    "text-sm",
                    "text-muted-foreground",
                    "hover:text-white",
                  ].join(" ")}
                  key={to}
                  to={to}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Decorative blobs for subtle flair matching landing visuals */}
      <div
        className={[
          "absolute",
          "-z-10",
          "left-0",
          "top-0",
          "h-40",
          "w-40",
          "rounded-full",
          "bg-gradient-to-br",
          "from-purple-500/30",
          "to-fuchsia-500/20",
          "blur-3xl",
        ].join(" ")}
      />
      <div
        className={[
          "absolute",
          "-z-10",
          "right-10",
          "top-0",
          "h-56",
          "w-56",
          "rounded-full",
          "bg-gradient-to-br",
          "from-cyan-400/25",
          "to-emerald-400/15",
          "blur-3xl",
        ].join(" ")}
      />
    </header>
  );
}
