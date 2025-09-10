import React from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden">
      {/* Background aesthetics */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,hsl(262_84%_60%/.25),transparent_60%),radial-gradient(800px_400px_at_110%_10%,hsl(292_84%_60%/.15),transparent_60%),radial-gradient(800px_400px_at_-10%_10%,hsl(202_84%_60%/.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(1000px_600px_at_center,black,transparent)]" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-0 px-4 py-10 lg:min-h-[100svh] lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-16">
        {/* Marketing / Brand panel */}
        <aside className="relative hidden flex-col justify-between lg:flex">
          <div>
            <Link className="inline-flex items-center gap-2" to="/">
              <img src="/icon.svg" alt="Icon" />
              <span className="text-lg font-semibold tracking-tight">Reflecto</span>
            </Link>

            <div className="mt-16 max-w-lg">
              <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-4 text-muted-foreground text-base">{subtitle}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-16 select-none text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Reflecto. All rights reserved.</p>
          </div>
        </aside>

        {/* Form panel */}
        <main className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <Card className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:bg-zinc-900/80">
              <CardHeader>
                <CardTitle className="text-2xl">{title}</CardTitle>
                {subtitle ? (
                  <CardDescription>{subtitle}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>{children}</CardContent>
            </Card>
            {footer ? <div className="mt-4">{footer}</div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
