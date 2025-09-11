# Reflecto

Reflecto is your AI‑powered second brain. Capture voice notes, images, and text—Reflecto automatically performs OCR and speech‑to‑text, organizes content into connected Spaces, and makes everything instantly searchable.

Originally bootstrapped with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).

## Features

- **Ingestion** — Upload images and voice notes. OCR and speech‑to‑text run automatically.
- **AI Processing** — Extracts text and metadata into a structured store for fast retrieval.
- **Spaces Graph** — Discover AI‑suggested relationships and navigate ideas visually.
- **Full‑text Search** — Find anything across your entire knowledge base with low latency.
- **Secure & Private** — Your data is yours—authentication and storage are handled securely.
- **Voice‑first** — Capture thoughts hands‑free and let Reflecto do the rest.
- **Beautiful UI** — React + Tailwind + shadcn/ui.
- **Portable** — PWA support and a Tauri desktop target.
- **Monorepo Tooling** — Turborepo orchestration, Husky pre‑commit hooks.

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Demo

The homepage embeds a looping YouTube preview. You can point it to your own video by setting an env variable in `apps/web/.env`:

```bash
VITE_YOUTUBE_DEMO_ID=<your_video_id>
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:
```bash
pnpm db:push
```


Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).





## Project Structure

```
Reflecto/
├── apps/
│   ├── web/           # Frontend (React + TanStack Router + Tailwind + shadcn/ui)
│   ├── server/        # Backend API (Hono, tRPC, Drizzle, PostgreSQL)
│   └── tldraw/        # tldraw integration (if enabled)
├── docs/              # Project docs and guides
├── turbo.json         # Turborepo pipeline config
├── pnpm-workspace.yaml
└── package.json       # Root scripts for dev/build
```

## Available Scripts

- `pnpm dev` — Run all relevant dev processes via Turborepo.
- `pnpm build` — Build all packages/apps.
- `pnpm check-types` — Typecheck across the monorepo.
- `pnpm dev:native` — Run the native (Tauri) app in dev, if present.
- `pnpm dev:web` — Run only the web app in dev.
- `pnpm dev:server` — Run only the server in dev.
- `pnpm db:push` — Apply Drizzle schema to the database.
- `pnpm db:studio` — Open Drizzle Studio.
- `pnpm db:generate` — Generate SQL migrations from schema.
- `pnpm db:migrate` — Run pending migrations.
- `pnpm db:start|db:stop|db:watch|db:down` — Local DB helpers (if configured).

## Authentication & Auth Flow (Appwrite)

The project now uses Appwrite Authentication instead of Better-Auth.

Environment variables:

- Server (`apps/server/.env`)
	- `APPWRITE_ENDPOINT` — e.g. https://<REGION>.cloud.appwrite.io/v1
	- `APPWRITE_PROJECT_ID` — your Appwrite Project ID

- Web (`apps/web/.env`)
	- `VITE_APPWRITE_ENDPOINT` — same endpoint as above
	- `VITE_APPWRITE_PROJECT_ID` — same project id
	- `VITE_SERVER_URL` — TRPC server URL (e.g. http://localhost:3000)
	- `VITE_YOUTUBE_DEMO_ID` — optional, overrides the homepage demo video

How it works:

- Web uses Appwrite's Account SDK to sign up/in and get the current user.
- For server calls, web obtains a short-lived JWT via `account.createJWT()` and sends it as `Authorization: Bearer <jwt>`.
- Server initializes an Appwrite Server SDK per request, reads the JWT (or falls back to `a_session_<PROJECT_ID>` cookie), and resolves the user with `account.get()` in TRPC context.
- Protected routes remain enforced via `protectedProcedure`.

Notes:

- If relying on session cookies from the browser, use a custom domain for Appwrite so cookies are first-party (or enable 3rd-party cookies in local dev).

## Tech Stack

- Web: React, TanStack Router, TanStack Query, TailwindCSS, shadcn/ui
- Server: Hono, tRPC, Drizzle ORM, PostgreSQL
- Infra/Tooling: Turborepo, pnpm, Biome, Husky, lint-staged
- Auth: Appwrite
- Desktop: Tauri (optional)

## Contributing

Contributions are welcome! Feel free to open issues and pull requests. Before committing, run:

```bash
pnpm check
```

## License

MIT
