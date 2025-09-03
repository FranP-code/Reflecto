# Reflecto

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Hono, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Husky** - Git hooks for code quality
- **PWA** - Progressive Web App support
- **Tauri** - Build native desktop applications
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
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
│   ├── web/         # Frontend application (React + TanStack Router)
│   └── server/      # Backend API (Hono, TRPC)
```

## Available Scripts


## Authentication (Appwrite)

The project now uses Appwrite Authentication instead of Better-Auth.

Environment variables:

- Server (`apps/server/.env`)
	- `APPWRITE_ENDPOINT` — e.g. https://<REGION>.cloud.appwrite.io/v1
	- `APPWRITE_PROJECT_ID` — your Appwrite Project ID

- Web (`apps/web/.env`)
	- `VITE_APPWRITE_ENDPOINT` — same endpoint as above
	- `VITE_APPWRITE_PROJECT_ID` — same project id
	- `VITE_SERVER_URL` — TRPC server URL (e.g. http://localhost:3000)

How it works:

- Web uses Appwrite's Account SDK to sign up/in and get the current user.
- For server calls, web obtains a short-lived JWT via `account.createJWT()` and sends it as `Authorization: Bearer <jwt>`.
- Server initializes an Appwrite Server SDK per request, reads the JWT (or falls back to `a_session_<PROJECT_ID>` cookie), and resolves the user with `account.get()` in TRPC context.
- Protected routes remain enforced via `protectedProcedure`.

Notes:

- If relying on session cookies from the browser, use a custom domain for Appwrite so cookies are first-party (or enable 3rd-party cookies in local dev).
