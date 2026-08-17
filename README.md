# KickZone

KickZone is a soccer field booking and management system. This repository is an npm-workspace monorepo containing a Next.js frontend and a NestJS API.

## Requirements

- Node.js 24+
- npm 11+

## Applications

- `apps/web` — Next.js, Tailwind CSS, shadcn/ui, TanStack Query, and Supabase browser client foundation
- `apps/api` — NestJS, Swagger, validation, scheduling, and Prisma/PostgreSQL foundation

## Local setup

1. Install dependencies with `npm install`.
2. Copy each app's `.env.example` to `.env.local` for the web app and `.env` for the API.
3. Fill in local or hosted service values when those services are configured.

No real Supabase credentials are required for the foundation build.

## Commands

```text
npm run dev:web       Start Next.js on http://localhost:3000
npm run dev:api       Start NestJS on http://localhost:3001
npm run build         Build all workspaces
npm run lint          Lint all workspaces
npm run typecheck     Typecheck all workspaces
npm test              Run API unit tests
npm run format:check  Check formatting
```

Swagger is available at `http://localhost:3001/docs` while the API is running.

## Current scope

The repository currently contains development foundation only. Authentication flows, database models, migrations, and KickZone business features have not been implemented.
